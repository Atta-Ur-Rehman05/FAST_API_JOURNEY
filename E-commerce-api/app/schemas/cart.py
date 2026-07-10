from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class CartItemBase(BaseModel):
    variant_id: UUID
    quantity: int = Field(default=1, gt=0)

class CartItemCreate(CartItemBase):
    pass

class CartItemUpdate(BaseModel):
    quantity: int = Field(gt=0)

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
    items: List[CartItemResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
