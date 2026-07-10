from uuid import UUID

from pydantic import BaseModel

from app.models.models import PaymentMethod
from app.schemas.order import OrderResponse
from app.schemas.payment import PaymentResponse


class CheckoutCreate(BaseModel):
    shipping_address_id: UUID
    billing_address_id: UUID
    payment_method: PaymentMethod
    transaction_id: str | None = None


class CheckoutResponse(BaseModel):
    order: OrderResponse
    payment: PaymentResponse
