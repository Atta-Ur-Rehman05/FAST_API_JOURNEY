from uuid import UUID

from pydantic import BaseModel, ConfigDict, model_validator

from app.models.models import PaymentMethod
from app.schemas.order import OrderResponse
from app.schemas.payment import PaymentResponse


class CheckoutCreate(BaseModel):
    shipping_address_id: UUID
    billing_address_id: UUID
    payment_method: PaymentMethod
    transaction_id: str | None = None

    model_config = ConfigDict(extra="forbid")

    @model_validator(mode="after")
    def disallow_client_stripe_transaction_id(self):
        if self.payment_method == PaymentMethod.stripe and self.transaction_id:
            raise ValueError("transaction_id is created by Stripe and must not be supplied.")
        return self


class CheckoutResponse(BaseModel):
    order: OrderResponse
    payment: PaymentResponse
    stripe_client_secret: str | None = None
