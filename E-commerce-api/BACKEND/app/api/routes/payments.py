from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.api.dependencies import SessionDep, get_current_admin_user
from app.models.models import Order, OrderStatus, Payment, PaymentMethod, PaymentStatus, StripeWebhookEvent, User
from app.schemas.payment import PaymentResponse
from app.services.order import OrderService, InvalidOrderTransitionError, OrderNotFoundError
from app.services.payment import transition_payment_status
from app.services.stripe import (
    StripeGatewayError,
    StripeNotConfiguredError,
    construct_webhook_event,
    create_refund,
)
from app.core.metrics import PAYMENT_FAILURES

router = APIRouter()


@router.post("/stripe/webhook", status_code=status.HTTP_200_OK)
async def stripe_webhook(
    request: Request,
    session: SessionDep,
    stripe_signature: Annotated[str | None, Header(alias="Stripe-Signature")] = None,
):
    """Verify a Stripe event and make its payment update exactly once."""
    if not stripe_signature:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing Stripe-Signature header.")

    try:
        event = construct_webhook_event(await request.body(), stripe_signature)
    except StripeNotConfiguredError as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(error))
    except StripeGatewayError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))

    event_id = event["id"]
    already_processed = await session.scalar(
        select(StripeWebhookEvent.id).where(StripeWebhookEvent.stripe_event_id == event_id)
    )
    if already_processed:
        return {"received": True}

    event_type = event["type"]
    stripe_object = event["data"]["object"]
    intent_id = (
        stripe_object.get("id")
        if event_type.startswith("payment_intent.")
        else stripe_object.get("payment_intent")
    )
    payment = None
    if intent_id:
        payment = await session.scalar(
            select(Payment).where(
                Payment.transaction_id == intent_id,
                Payment.payment_method == PaymentMethod.stripe,
            )
        )

    if payment:
        if event_type == "payment_intent.succeeded":
            transition_payment_status(payment, PaymentStatus.completed)
        elif event_type in {"payment_intent.payment_failed", "payment_intent.canceled"}:
            transition_payment_status(payment, PaymentStatus.failed)
            PAYMENT_FAILURES.labels(reason=event_type).inc()
            order_service = OrderService(session)
            order = await order_service.get_order(payment.order_id)
            if order.order_status in (OrderStatus.pending, OrderStatus.processing):
                try:
                    await order_service.transition_status(order.id, OrderStatus.failed)
                except InvalidOrderTransitionError:
                    pass
        elif event_type == "charge.refunded" or (
            event_type == "refund.updated" and stripe_object.get("status") == "succeeded"
        ):
            transition_payment_status(payment, PaymentStatus.refunded)

    session.add(
        StripeWebhookEvent(
            stripe_event_id=event_id,
            event_type=event_type,
            payment_id=payment.id if payment else None,
        )
    )
    try:
        await session.commit()
    except IntegrityError:
        # Stripe can deliver the same event concurrently; the unique event ID
        # makes the losing request a successful no-op.
        await session.rollback()
    return {"received": True}


@router.post("/{payment_id}/refund", response_model=PaymentResponse)
async def refund_stripe_payment(
    payment_id: UUID,
    session: SessionDep,
    _: Annotated[User, Depends(get_current_admin_user)],
):
    """Start (or safely retry) a full Stripe refund for a completed payment."""
    payment = await session.scalar(select(Payment).where(Payment.id == payment_id))
    if payment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found.")
    if payment.payment_method != PaymentMethod.stripe:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only Stripe payments can be refunded here.")
    if payment.payment_status == PaymentStatus.refunded:
        return payment
    if payment.payment_status != PaymentStatus.completed or not payment.transaction_id:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only completed Stripe payments can be refunded.")

    try:
        refund = await create_refund(
            payment_intent_id=payment.transaction_id, payment_id=payment.id
        )
    except StripeNotConfiguredError as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(error))
    except StripeGatewayError as error:
        PAYMENT_FAILURES.labels(reason="refund_gateway_error").inc()
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(error))

    # Stripe may return a pending refund. Its signed webhook remains the
    # source of truth in that case; a synchronous success can be recorded now.
    if refund.status == "succeeded":
        transition_payment_status(payment, PaymentStatus.refunded)
        await session.commit()
    return payment
