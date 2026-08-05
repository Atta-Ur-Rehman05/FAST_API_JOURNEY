import logging
import secrets
from datetime import datetime, timedelta
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from jose import JWTError, jwt
from sqlalchemy import select, update

from app.api.dependencies import SessionDep
from app.core.config import settings
from app.core.rate_limit import login_rate_limiter
from app.core.security import (create_access_token, create_refresh_token,
                               get_password_hash, hash_token, verify_password)
from app.models.models import PasswordResetToken, RefreshToken
from app.repositories.user import UserRepository
from app.schemas.token import RefreshTokenRequest, Token
from app.schemas.user import (PasswordResetConfirm, PasswordResetRequest,
                              UserCreate, UserResponse)

router = APIRouter()
logger = logging.getLogger(__name__)

def _issue_tokens(user_id: UUID) -> tuple[str, str, str, datetime]:
    access = create_access_token(subject=user_id, expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    refresh, token_id, expires_at = create_refresh_token(subject=user_id)
    return access, refresh, token_id, expires_at

async def _store_refresh_token(session: SessionDep, user_id: UUID, token: str, token_id: str, expires_at: datetime) -> None:
    session.add(RefreshToken(user_id=user_id, token_id=token_id, token_hash=hash_token(token), expires_at=expires_at))
    await session.commit()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, session: SessionDep):
    user_repo = UserRepository(session)
    if await user_repo.get_by_email(email=user_in.email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The user with this username already exists in the system.")
    return await user_repo.create(user_in=user_in)

@router.post("/login", response_model=Token)
async def login_access_token(request: Request, session: SessionDep, form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    client_ip = request.client.host if request.client else "unknown"
    retry_after = login_rate_limiter.check(
        f"{client_ip}:{form_data.username.lower()}", settings.LOGIN_RATE_LIMIT_ATTEMPTS, settings.LOGIN_RATE_LIMIT_WINDOW_SECONDS
    )
    if retry_after is not None:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many login attempts. Please try again later.", headers={"Retry-After": str(retry_after)})
    user = await UserRepository(session).get_by_email(email=form_data.username)
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect email or password")
    access, refresh, token_id, expires_at = _issue_tokens(user.id)
    await _store_refresh_token(session, user.id, refresh, token_id, expires_at)
    return {"access_token": access, "refresh_token": refresh, "token_type": "bearer"}

@router.post("/refresh", response_model=Token)
async def refresh_access_token(payload: RefreshTokenRequest, session: SessionDep):
    try:
        claims = jwt.decode(payload.refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if claims.get("type") != "refresh" or not claims.get("jti") or not claims.get("sub"):
            raise JWTError("Invalid refresh token")
        user_id = UUID(claims["sub"])
    except (JWTError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token", headers={"WWW-Authenticate": "Bearer"})
    token = (await session.execute(select(RefreshToken).where(RefreshToken.token_id == claims["jti"]))).scalar_one_or_none()
    now = datetime.utcnow()
    if not token or token.user_id != user_id or token.token_hash != hash_token(payload.refresh_token) or token.revoked_at or token.expires_at <= now:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or revoked refresh token", headers={"WWW-Authenticate": "Bearer"})
    # Rotation makes a stolen token single-use.
    token.revoked_at = now
    access, refresh, token_id, expires_at = _issue_tokens(user_id)
    session.add(RefreshToken(user_id=user_id, token_id=token_id, token_hash=hash_token(refresh), expires_at=expires_at))
    await session.commit()
    return {"access_token": access, "refresh_token": refresh, "token_type": "bearer"}

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(payload: RefreshTokenRequest, session: SessionDep) -> Response:
    # Logout is intentionally idempotent and never reveals token state.
    await session.execute(update(RefreshToken).where(RefreshToken.token_hash == hash_token(payload.refresh_token), RefreshToken.revoked_at.is_(None)).values(revoked_at=datetime.utcnow()))
    await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.post("/password-reset/request", status_code=status.HTTP_202_ACCEPTED)
async def request_password_reset(payload: PasswordResetRequest, session: SessionDep):
    user = await UserRepository(session).get_by_email(payload.email)
    # Same response prevents account enumeration. Integrate a transactional email
    # provider here; never put this token in a log or API response.
    response = {"message": "If the account exists, password reset instructions will be sent."}
    if user:
        raw_token = secrets.token_urlsafe(32)
        session.add(PasswordResetToken(user_id=user.id, token_hash=hash_token(raw_token), expires_at=datetime.utcnow() + timedelta(minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES)))
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
    now = datetime.utcnow()
    if not token or token.used_at or token.expires_at <= now:
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
