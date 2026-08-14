from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime


class WishlistItemResponse(BaseModel):
    id: UUID
    product_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WishlistResponse(BaseModel):
    id: UUID
    user_id: UUID
    items: list[WishlistItemResponse] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WishlistItemCreate(BaseModel):
    product_id: UUID
