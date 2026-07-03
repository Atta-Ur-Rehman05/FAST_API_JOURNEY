from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from app.models.models import PaymentMethod, PaymentStatus

class PaymentBase(BaseModel):
    order_id: UUID
    payment_method: PaymentMethod
    amount: Decimal

class PaymentCreate(PaymentBase):
    pass

class PaymentUpdate(BaseModel):
    payment_status: Optional[PaymentStatus] = None
    transaction_id: Optional[str] = None

class PaymentResponse(PaymentBase):
    id: UUID
    transaction_id: Optional[str] = None
    payment_status: PaymentStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
