"""Stripe gateway operations kept outside the checkout database transaction."""

import asyncio
from decimal import Decimal, ROUND_HALF_UP
from uuid import UUID

import stripe

from app.core.config import settings


class StripeServiceError(Exception):
    pass


class StripeNotConfiguredError(StripeServiceError):
    pass


class StripeGatewayError(StripeServiceError):
    pass


def _require_secret_key() -> str:
    if not settings.STRIPE_SECRET_KEY:
        raise StripeNotConfiguredError("Stripe payments are not configured.")
    return settings.STRIPE_SECRET_KEY


def amount_in_smallest_currency_unit(amount: Decimal) -> int:
    """Convert a two-decimal store amount to Stripe's smallest currency unit."""
    return int((amount * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


async def create_payment_intent(*, amount: Decimal, order_id: UUID, payment_id: UUID):
    api_key = _require_secret_key()
    try:
        return await asyncio.to_thread(
            stripe.PaymentIntent.create,
            amount=amount_in_smallest_currency_unit(amount),
            currency=settings.STRIPE_CURRENCY.lower(),
            automatic_payment_methods={"enabled": True},
            metadata={"order_id": str(order_id), "payment_id": str(payment_id)},
            # Repeated checkout calls produce/retrieve exactly one intent.
            idempotency_key=f"ecommerce-order-{order_id}",
            api_key=api_key,
        )
    except stripe.StripeError as exc:
        raise StripeGatewayError("Unable to create the Stripe payment intent.") from exc


async def create_refund(*, payment_intent_id: str, payment_id: UUID):
    api_key = _require_secret_key()
    try:
        return await asyncio.to_thread(
            stripe.Refund.create,
            payment_intent=payment_intent_id,
            # A retry of the API request cannot create a second refund.
            idempotency_key=f"ecommerce-refund-{payment_id}",
            api_key=api_key,
        )
    except stripe.StripeError as exc: 
        raise StripeGatewayError("Unable to create the Stripe refund.") from exc


def construct_webhook_event(payload: bytes, signature: str):
    _require_secret_key()
    if not settings.STRIPE_WEBHOOK_SECRET:
        raise StripeNotConfiguredError("Stripe webhook verification is not configured.")
    try:
        return stripe.Webhook.construct_event(
            payload=payload, sig_header=signature, secret=settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError as exc:
        raise StripeGatewayError("Invalid Stripe webhook payload.") from exc
    except stripe.SignatureVerificationError as exc:
        raise StripeGatewayError("Invalid Stripe webhook signature.") from exc
