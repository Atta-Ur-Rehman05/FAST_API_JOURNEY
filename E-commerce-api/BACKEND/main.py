from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.db import create_tables
from app.api.routes import api_router
from app.core.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    await create_tables()
    yield
    # Shutdown actions could go here if needed

app = FastAPI(title="E-Commerce API", lifespan=lifespan)

# CORS origins must be explicitly configured per environment.  Wildcards are
# unsafe with credentialed requests because any website could invoke the API
# using a visitor's browser credentials.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Idempotency-Key"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "Welcome to the E-commerce API"}
