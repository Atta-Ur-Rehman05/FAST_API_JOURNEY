# this file contain the user schemas

from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from app.models.models import RoleType, AddressType

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    role: RoleType = RoleType.customer

class UserCreate(UserBase):
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        from app.core.security import validate_password_policy      # this prevnet circular import
        return validate_password_policy(value)

class UserUpdate(BaseModel):      # partial update schema
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    password: Optional[str] = None

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: Optional[str]) -> Optional[str]:
        if value is not None:
            from app.core.security import validate_password_policy
            return validate_password_policy(value)
        return value

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        from app.core.security import validate_password_policy
        return validate_password_policy(value)

class UserResponse(UserBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
