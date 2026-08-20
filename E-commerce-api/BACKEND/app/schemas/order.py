from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from app.models.models import OrderStatus
from app.schemas.address import AddressResponse
from app.schemas.payment import PaymentResponse
from app.schemas.product import ProductVariantResponse
from app.schemas.user import UserResponse

class OrderItemBase(BaseModel):
    variant_id: UUID
    quantity: int = Field(gt=0)
    price_per_item: Decimal

class OrderItemCreate(BaseModel):
    variant_id: UUID
    quantity: int = Field(gt=0)

    model_config = ConfigDict(extra="forbid")

class OrderItemUpdate(BaseModel):
    quantity: Optional[int] = Field(default=None, gt=0)

class OrderItemResponse(OrderItemBase):
    id: int
    order_id: UUID
    variant: ProductVariantResponse

    model_config = ConfigDict(from_attributes=True)


class OrderBase(BaseModel):
    shipping_address_id: UUID
    billing_address_id: UUID
    total_amount: Decimal
    order_status: OrderStatus = OrderStatus.draft

class OrderCreate(BaseModel):
    shipping_address_id: UUID
    billing_address_id: UUID

    model_config = ConfigDict(extra="forbid")

class OrderUpdate(BaseModel):
    shipping_address_id: Optional[UUID] = None
    billing_address_id: Optional[UUID] = None

    model_config = ConfigDict(extra="forbid")


class OrderStatusUpdate(BaseModel):
    order_status: OrderStatus

    model_config = ConfigDict(extra="forbid")

class OrderResponse(OrderBase):
    id: UUID
    user_id: UUID
    user: UserResponse
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = Field(default_factory=list)
    payment: PaymentResponse | None = None
    shipping_address: AddressResponse
    billing_address: AddressResponse

    model_config = ConfigDict(from_attributes=True)
