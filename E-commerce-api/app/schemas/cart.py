from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class CartItemBase(BaseModel):
    variant_id: UUID
    quantity: int = 1

class CartItemCreate(CartItemBase):
    pass

class CartItemUpdate(BaseModel):
    quantity: int

class CartItemResponse(CartItemBase):
    id: int
    cart_id: UUID

    model_config = ConfigDict(from_attributes=True)


class CartBase(BaseModel):
    user_id: Optional[UUID] = None

class CartCreate(CartBase):
    pass

class CartUpdate(BaseModel):
    user_id: UUID

class CartResponse(CartBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    items: List[CartItemResponse] = []

    model_config = ConfigDict(from_attributes=True)
