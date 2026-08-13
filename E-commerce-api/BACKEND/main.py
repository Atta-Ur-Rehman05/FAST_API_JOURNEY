from contextlib import asynccontextmanager
import logging
import re
import time
import uuid
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from app.db.db import create_tables
from app.db.db import engine
from app.api.routes import api_router
from app.core.config import settings
from app.core.logging import configure_logging
from app.core.metrics import REQUEST_DURATION, REDIS_UP, POSTGRES_UP
from app.core.rate_limit import login_rate_limiter

configure_logging()
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    await create_tables()
    yield
    # Shutdown actions could go here if needed

app = FastAPI(title="E-Commerce API", lifespan=lifespan)

if settings.SENTRY_DSN:
    try:
        import sentry_sdk
        sentry_sdk.init(dsn=settings.SENTRY_DSN, environment=settings.ENVIRONMENT, send_default_pii=False)
    except ImportError:
        logger.warning("sentry_sdk_not_installed")

@app.middleware("http")
async def observability_and_security_middleware(request: Request, call_next):
    supplied_id = request.headers.get("X-Request-ID", "")
    request_id = supplied_id if re.fullmatch(r"[A-Za-z0-9_-]{1,128}", supplied_id) else str(uuid.uuid4())
    started = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        logger.exception("unhandled_request_error", extra={"request_id": request_id, "method": request.method, "path": request.url.path})
        try:
            import sentry_sdk
            sentry_sdk.capture_exception()
        except ImportError:
            pass
        response = JSONResponse(status_code=500, content={"detail": "Internal server error", "request_id": request_id})
    duration_ms = round((time.perf_counter() - started) * 1000, 2)
    endpoint = _sanitize_endpoint(request.url.path)
    try:
        REQUEST_DURATION.labels(method=request.method, endpoint=endpoint, status_code=response.status_code).observe(duration_ms / 1000)
    except Exception:
        pass
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
    # HSTS is only meaningful over HTTPS and can break local HTTP development.
    if request.url.scheme == "https":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    logger.info("request_complete", extra={"request_id": request_id, "method": request.method, "path": request.url.path, "status_code": response.status_code, "duration_ms": duration_ms})
    return response

# CORS origins must be explicitly configured per environment.  Wildcards are
# unsafe with credentialed requests because any website could invoke the API
# using a visitor's browser credentials.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Idempotency-Key", "X-Request-ID"],
    expose_headers=["X-Request-ID", "Retry-After"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "Welcome to the E-commerce API"}

@app.get("/health", tags=["operations"])
async def health():
    """Liveness probe: process is responding without checking dependencies."""
    return {"status": "ok"}


def _sanitize_endpoint(path: str) -> str:
    return re.sub(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", "{id}", path, flags=re.IGNORECASE)


@app.get("/readiness", tags=["operations"])
async def readiness():
    """Readiness probe: only ready to receive traffic when the database responds."""
    db_ready = False
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
        db_ready = True
    except Exception:
        logger.exception("readiness_postgres_check_failed")
    POSTGRES_UP.set(1 if db_ready else 0)

    redis_ready = False
    if settings.REDIS_URL:
        try:
            redis_ready = await login_rate_limiter.ping()
        except Exception:
            logger.exception("readiness_redis_check_failed")
    REDIS_UP.set(1 if redis_ready else 0)

    if db_ready and (not settings.REDIS_URL or redis_ready):
        return {"status": "ready"}
    return JSONResponse(status_code=503, content={"status": "not_ready"})


@app.get("/metrics", tags=["operations"])
async def metrics():
    from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
    return JSONResponse(content=generate_latest().decode("utf-8"), media_type=CONTENT_TYPE_LATEST)
