import logging
import secrets
from datetime import UTC, datetime, timedelta
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from jose import JWTError, jwt
from sqlalchemy import select, update

from app.api.dependencies import SessionDep
from app.core.config import settings
from app.core.rate_limit import login_rate_limiter
from app.core.time import utc_now
from app.core.security import (create_access_token, create_refresh_token,
                               DUMMY_PASSWORD_HASH, get_password_hash, hash_token,
                               verify_password)
from app.models.models import PasswordResetToken, RefreshToken
from app.repositories.user import UserRepository
from app.schemas.token import RefreshTokenRequest, Token
from app.schemas.user import (PasswordResetConfirm, PasswordResetRequest,
                              UserCreate, UserResponse)

router = APIRouter()
logger = logging.getLogger(__name__)

def _as_utc(value: datetime) -> datetime:
    """SQLite test databases may return timestamps without timezone metadata."""
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)

def _issue_tokens(user_id: UUID) -> tuple[str, str, str, datetime]:
    access = create_access_token(subject=user_id, expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    refresh, token_id, expires_at = create_refresh_token(subject=user_id)
    return access, refresh, token_id, expires_at

async def _store_refresh_token(session: SessionDep, user_id: UUID, token: str, token_id: str, expires_at: datetime) -> None:
    session.add(RefreshToken(user_id=user_id, token_id=token_id, token_hash=hash_token(token), expires_at=expires_at))
    await session.commit()

def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=settings.REFRESH_COOKIE_SECURE,
        samesite=settings.REFRESH_COOKIE_SAMESITE,
        domain=settings.REFRESH_COOKIE_DOMAIN,
        path="/api/v1/auth",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
    )

def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        domain=settings.REFRESH_COOKIE_DOMAIN,
        path="/api/v1/auth",
        secure=settings.REFRESH_COOKIE_SECURE,
        httponly=True,
        samesite=settings.REFRESH_COOKIE_SAMESITE,
    )

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, session: SessionDep):
    user_repo = UserRepository(session)
    if await user_repo.get_by_email(email=user_in.email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The user with this username already exists in the system.")
    return await user_repo.create(user_in=user_in)

@router.post("/login", response_model=Token)
async def login_access_token(request: Request, response: Response, session: SessionDep, form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    client_ip = request.client.host if request.client else "unknown"
    try:
        retry_after = await login_rate_limiter.check(form_data.username, client_ip)
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Login is temporarily unavailable") from exc
    if retry_after is not None:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many login attempts. Please try again later.", headers={"Retry-After": str(retry_after)})
    user = await UserRepository(session).get_by_email(email=form_data.username)
    password_is_valid = verify_password(form_data.password, user.password_hash if user else DUMMY_PASSWORD_HASH)
    if not user or not password_is_valid:
        try:
            retry_after = await login_rate_limiter.record_failure(form_data.username, client_ip)
        except RuntimeError as exc:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Login is temporarily unavailable") from exc
        if retry_after is not None:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many login attempts. Please try again later.", headers={"Retry-After": str(retry_after)})
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password", headers={"WWW-Authenticate": "Bearer"})
    try:
        await login_rate_limiter.reset(form_data.username, client_ip)
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Login is temporarily unavailable") from exc
    access, refresh, token_id, expires_at = _issue_tokens(user.id)
    await _store_refresh_token(session, user.id, refresh, token_id, expires_at)
    _set_refresh_cookie(response, refresh)
    return {"access_token": access, "token_type": "bearer"}

@router.post("/refresh", response_model=Token)
async def refresh_access_token(request: Request, response: Response, session: SessionDep, payload: RefreshTokenRequest | None = None):
    raw_refresh_token = request.cookies.get(settings.REFRESH_COOKIE_NAME) or (payload.refresh_token if payload else None)
    if not raw_refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token", headers={"WWW-Authenticate": "Bearer"})
    try:
        claims = jwt.decode(raw_refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if claims.get("type") != "refresh" or not claims.get("jti") or not claims.get("sub"):
            raise JWTError("Invalid refresh token")
        user_id = UUID(claims["sub"])
    except (JWTError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token", headers={"WWW-Authenticate": "Bearer"})
    token = (await session.execute(select(RefreshToken).where(RefreshToken.token_id == claims["jti"]))).scalar_one_or_none()
    now = utc_now()
    if not token or token.user_id != user_id or token.token_hash != hash_token(raw_refresh_token) or token.revoked_at or _as_utc(token.expires_at) <= now:
        if token and token.user_id == user_id:
            # A rotated/revoked token presented again is a likely theft signal.
            await session.execute(update(RefreshToken).where(RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None)).values(revoked_at=now))
            await session.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or revoked refresh token", headers={"WWW-Authenticate": "Bearer"})
    # Rotation makes a stolen token single-use.
    token.revoked_at = now
    access, refresh, token_id, expires_at = _issue_tokens(user_id)
    session.add(RefreshToken(user_id=user_id, token_id=token_id, token_hash=hash_token(refresh), expires_at=expires_at))
    await session.commit()
    _set_refresh_cookie(response, refresh)
    return {"access_token": access, "token_type": "bearer"}

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(request: Request, session: SessionDep, payload: RefreshTokenRequest | None = None) -> Response:
    # Logout is intentionally idempotent and never reveals token state.
    raw_refresh_token = request.cookies.get(settings.REFRESH_COOKIE_NAME) or (payload.refresh_token if payload else None)
    if raw_refresh_token:
        await session.execute(update(RefreshToken).where(RefreshToken.token_hash == hash_token(raw_refresh_token), RefreshToken.revoked_at.is_(None)).values(revoked_at=utc_now()))
        await session.commit()
    response = Response(status_code=status.HTTP_204_NO_CONTENT)
    _clear_refresh_cookie(response)
    return response

@router.post("/password-reset/request", status_code=status.HTTP_202_ACCEPTED)
async def request_password_reset(payload: PasswordResetRequest, session: SessionDep):
    user = await UserRepository(session).get_by_email(payload.email)
    # Same response prevents account enumeration. Integrate a transactional email
    # provider here; never put this token in a log or API response.
    response = {"message": "If the account exists, password reset instructions will be sent."}
    if user:
        raw_token = secrets.token_urlsafe(32)
        session.add(PasswordResetToken(user_id=user.id, token_hash=hash_token(raw_token), expires_at=utc_now() + timedelta(minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES)))
        await session.commit()
        logger.info("password_reset_requested", extra={"user_id": str(user.id)})
        # A mail provider should deliver this token. This opt-in is solely for
        # local integration testing and is never enabled by production defaults.
        if settings.ENVIRONMENT == "development" and settings.EXPOSE_RESET_TOKEN_IN_DEVELOPMENT:
            response["reset_token"] = raw_token
    return response

@router.post("/password-reset/confirm", status_code=status.HTTP_204_NO_CONTENT)
async def confirm_password_reset(payload: PasswordResetConfirm, session: SessionDep) -> Response:
    token = (await session.execute(select(PasswordResetToken).where(PasswordResetToken.token_hash == hash_token(payload.token)))).scalar_one_or_none()
    now = utc_now()
    if not token or token.used_at or _as_utc(token.expires_at) <= now:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired password reset token")
    user = await UserRepository(session).get_by_id(token.user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired password reset token")
    user.password_hash = get_password_hash(payload.new_password)
    token.used_at = now
    # A password change invalidates every existing refresh session.
    await session.execute(update(RefreshToken).where(RefreshToken.user_id == user.id, RefreshToken.revoked_at.is_(None)).values(revoked_at=now))
    await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
