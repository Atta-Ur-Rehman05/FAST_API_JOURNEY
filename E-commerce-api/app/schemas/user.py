from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from app.models.models import RoleType, AddressType

# Address Schemas
class AddressBase(BaseModel):
    address_type: AddressType
    street_address: str
    city: str
    state: str
    postal_code: str
    country: str
    phone_number: str

class AddressCreate(AddressBase):
    pass

class AddressUpdate(BaseModel):
    address_type: Optional[AddressType] = None
    street_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    phone_number: Optional[str] = None

class AddressResponse(AddressBase):
    id: UUID
    user_id: UUID

    model_config = ConfigDict(from_attributes=True)

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    role: RoleType = RoleType.customer

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    addresses: List[AddressResponse] = []

    model_config = ConfigDict(from_attributes=True)
