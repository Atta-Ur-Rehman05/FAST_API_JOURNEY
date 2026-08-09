"""Payment state-machine rules shared by provider-facing routes."""

# this file contain the payment state-machine rules

from app.models.models import Payment, PaymentStatus


VALID_PAYMENT_TRANSITIONS: dict[PaymentStatus, set[PaymentStatus]] = {
    PaymentStatus.pending: {PaymentStatus.completed, PaymentStatus.failed},
    # Stripe PaymentIntents can be retried after a failed attempt.
    PaymentStatus.failed: {PaymentStatus.completed},
    PaymentStatus.completed: {PaymentStatus.refunded},
    PaymentStatus.refunded: set(),
}


def transition_payment_status(payment: Payment, new_status: PaymentStatus) -> bool:
    """Apply a valid provider status change; return whether the record changed."""
    if payment.payment_status == new_status:
        return False
    if new_status not in VALID_PAYMENT_TRANSITIONS[payment.payment_status]:
        return False
    payment.payment_status = new_status
    return True
