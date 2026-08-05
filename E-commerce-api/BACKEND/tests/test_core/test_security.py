import pytest
from datetime import timedelta
from jose import jwt
from uuid import uuid4
from fastapi import HTTPException
from app.core.security import (create_access_token, create_refresh_token,
                               get_password_hash, verify_password)
from app.core.config import settings
from app.api.dependencies import get_current_user
from app.models.models import User, RoleType

def test_password_hashing_and_verification():
    raw_pass = "MySecretPass123!"
    hashed = get_password_hash(raw_pass)
    assert hashed != raw_pass
    assert verify_password(raw_pass, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_create_access_token_default_and_custom_delta():
    user_id = str(uuid4())
    token_default = create_access_token(subject=user_id)
    decoded_default = jwt.decode(token_default, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert decoded_default["sub"] == user_id

    custom_delta = timedelta(hours=2)
    token_custom = create_access_token(subject=user_id, expires_delta=custom_delta)
    decoded_custom = jwt.decode(token_custom, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert decoded_custom["sub"] == user_id

@pytest.mark.asyncio
async def test_auth_dependencies_invalid_token(db_session):
    # Invalid token syntax / decode error
    with pytest.raises(HTTPException) as exc1:
        await get_current_user(db_session, "invalid.jwt.token")
    assert exc1.value.status_code == 401

    # Token with missing sub claim
    missing_sub_token = jwt.encode({}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    with pytest.raises(HTTPException) as exc2:
        await get_current_user(db_session, missing_sub_token)
    assert exc2.value.status_code == 401

    # Token with non-UUID string sub claim
    invalid_uuid_token = create_access_token(subject="not-a-uuid")
    with pytest.raises(HTTPException) as exc3:
        await get_current_user(db_session, invalid_uuid_token)
    assert exc3.value.status_code == 401

    # Token with non-existent user UUID sub claim
    non_existent_uuid_token = create_access_token(subject=str(uuid4()))
    with pytest.raises(HTTPException) as exc4:
        await get_current_user(db_session, non_existent_uuid_token)
    assert exc4.value.status_code == 401

    # A refresh credential can only be used to rotate tokens; it is never an
    # application bearer credential.
    refresh_token, _, _ = create_refresh_token(subject=str(uuid4()))
    with pytest.raises(HTTPException) as exc5:
        await get_current_user(db_session, refresh_token)
    assert exc5.value.status_code == 401
