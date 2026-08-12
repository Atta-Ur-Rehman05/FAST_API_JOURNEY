# this file contain the shared security utilities for the application
# this mean that this file will be used by all the other modules in the application

from datetime import UTC, datetime, timedelta
from typing import Any, Union
from uuid import uuid4
import hashlib
from jose import jwt
import bcrypt
from app.core.config import settings

# Used when an email is unknown so failed logins take comparable time and do
# not become an account-enumeration oracle.
DUMMY_PASSWORD_HASH = bcrypt.hashpw(b"not-a-real-password", bcrypt.gensalt()).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except ValueError:
        return False

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def validate_password_policy(password: str) -> str:
    if len(password) < settings.PASSWORD_MIN_LENGTH:
        raise ValueError(f"Password must be at least {settings.PASSWORD_MIN_LENGTH} characters long")
    if len(password) > 128:
        raise ValueError("Password must not exceed 128 characters")
    if settings.ENVIRONMENT == "production":
        if not any(char.islower() for char in password):
            raise ValueError("Password must contain a lowercase letter")
        if not any(char.isupper() for char in password):
            raise ValueError("Password must contain an uppercase letter")
        if not any(char.isdigit() for char in password):
            raise ValueError("Password must contain a number")
    return password

def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject), "type": "access", "jti": str(uuid4())}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token(subject: Union[str, Any]) -> tuple[str, str, datetime]:
    expires_at = datetime.now(UTC) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    token_id = str(uuid4())
    token = jwt.encode({"exp": expires_at, "sub": str(subject), "type": "refresh", "jti": token_id}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return token, token_id, expires_at
