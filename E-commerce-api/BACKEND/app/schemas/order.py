from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from app.models.models import OrderStatus

class OrderItemBase(BaseModel):
    variant_id: UUID
    quantity: int = Field(gt=0)
    price_per_item: Decimal

class OrderItemCreate(OrderItemBase):
    pass

class OrderItemUpdate(BaseModel):
    quantity: Optional[int] = Field(default=None, gt=0)
    price_per_item: Optional[Decimal] = None

class OrderItemResponse(OrderItemBase):
    id: int
    order_id: UUID

    model_config = ConfigDict(from_attributes=True)


class OrderBase(BaseModel):
    shipping_address_id: UUID
    billing_address_id: UUID
    total_amount: Decimal
    order_status: OrderStatus = OrderStatus.pending

class OrderCreate(OrderBase):
    pass

class OrderUpdate(BaseModel):
    shipping_address_id: Optional[UUID] = None
    billing_address_id: Optional[UUID] = None
    total_amount: Optional[Decimal] = None
    order_status: Optional[OrderStatus] = None

class OrderResponse(OrderBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
