#  this file contain address schema

import re    # regular expression validation phone and postel code 
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.models.models import AddressType


def validate_not_empty(v: Optional[str], field_name: str) -> Optional[str]:
    if v is not None:
        v = v.strip()
        if not v:
            raise ValueError(f"{field_name} cannot be empty or contain only whitespace")
    return v


class AddressBase(BaseModel):
    full_name: str = Field(..., description="Full name of the recipient")
    phone: str = Field(..., description="Phone number")
    address_line_1: str = Field(..., description="Street address line 1")
    address_line_2: Optional[str] = Field(None, description="Street address line 2 (optional)")
    city: str = Field(..., description="City")
    state: str = Field(..., description="State or Province")
    postal_code: str = Field(..., description="Postal / ZIP Code")
    country: str = Field(..., description="Country")
    address_type: AddressType = Field(default=AddressType.Home, description="Type of address (Home, Office, Other)")
    is_default_shipping: bool = Field(default=False, description="Mark as default shipping address")
    is_default_billing: bool = Field(default=False, description="Mark as default billing address")

    @field_validator("full_name", "address_line_1", "city", "state", "country")
    @classmethod
    def check_not_empty(cls, v: str) -> str:
        res = validate_not_empty(v, "Field")
        if res is None:
            raise ValueError("Field cannot be empty")
        return res

    @field_validator("address_line_2")
    @classmethod
    def check_address_line_2(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = v.strip()
        return v if v else None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        v = validate_not_empty(v, "Phone number")
        # Ensure phone is between 7 and 20 chars and contains valid phone characters
        if len(v) < 7 or len(v) > 20:
            raise ValueError("Phone number must be between 7 and 20 characters")
        if not re.match(r"^\+?[0-9\s\-\(\)]+$", v):
            raise ValueError("Invalid phone number format")
        return v

    @field_validator("postal_code")
    @classmethod
    def validate_postal_code(cls, v: str) -> str:
        v = validate_not_empty(v, "Postal code")
        if len(v) < 3 or len(v) > 10:
            raise ValueError("Postal code must be between 3 and 10 characters")
        if not re.match(r"^[A-Za-z0-9\s\-]+$", v):
            raise ValueError("Invalid postal code format")
        return v


class AddressCreate(AddressBase):
    pass


class AddressUpdate(BaseModel):
    full_name: Optional[str] = Field(None, description="Full name of the recipient")
    phone: Optional[str] = Field(None, description="Phone number")
    address_line_1: Optional[str] = Field(None, description="Street address line 1")
    address_line_2: Optional[str] = Field(None, description="Street address line 2 (optional)")
    city: Optional[str] = Field(None, description="City")
    state: Optional[str] = Field(None, description="State or Province")
    postal_code: Optional[str] = Field(None, description="Postal / ZIP Code")
    country: Optional[str] = Field(None, description="Country")
    address_type: Optional[AddressType] = Field(None, description="Type of address (Home, Office, Other)")
    is_default_shipping: Optional[bool] = Field(None, description="Mark as default shipping address")
    is_default_billing: Optional[bool] = Field(None, description="Mark as default billing address")

    @field_validator("full_name", "address_line_1", "city", "state", "country")
    @classmethod
    def check_not_empty(cls, v: Optional[str]) -> Optional[str]:
        return validate_not_empty(v, "Field")

    @field_validator("address_line_2")
    @classmethod
    def check_address_line_2(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = v.strip()
        return v if v else None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = validate_not_empty(v, "Phone number")
        if len(v) < 7 or len(v) > 20:
            raise ValueError("Phone number must be between 7 and 20 characters")
        if not re.match(r"^\+?[0-9\s\-\(\)]+$", v):
            raise ValueError("Invalid phone number format")
        return v

    @field_validator("postal_code")
    @classmethod
    def validate_postal_code(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = validate_not_empty(v, "Postal code")
        if len(v) < 3 or len(v) > 10:
            raise ValueError("Postal code must be between 3 and 10 characters")
        if not re.match(r"^[A-Za-z0-9\s\-]+$", v):
            raise ValueError("Invalid postal code format")
        return v


class AddressResponse(AddressBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AddressListResponse(BaseModel):
    items: List[AddressResponse]
    total: int
    page: int
    page_size: int
    next_page: int | None
