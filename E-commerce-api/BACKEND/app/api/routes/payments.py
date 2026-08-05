from typing import Annotated

from fastapi import APIRouter, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.api.dependencies import SessionDep
from app.models.models import Payment, PaymentMethod, PaymentStatus, StripeWebhookEvent
from app.services.stripe import (
    StripeGatewayError,
    StripeNotConfiguredError,
    construct_webhook_event,
)

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
        if event_type == "payment_intent.succeeded" and payment.payment_status != PaymentStatus.refunded:
            payment.payment_status = PaymentStatus.completed
        elif event_type in {"payment_intent.payment_failed", "payment_intent.canceled"} and payment.payment_status == PaymentStatus.pending:
            payment.payment_status = PaymentStatus.failed
        elif event_type == "charge.refunded":
            payment.payment_status = PaymentStatus.refunded

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
