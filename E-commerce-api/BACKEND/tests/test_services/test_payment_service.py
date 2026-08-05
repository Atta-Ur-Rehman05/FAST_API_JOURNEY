from app.models.models import Payment, PaymentStatus
from app.services.payment import transition_payment_status


def test_payment_status_transitions_are_provider_safe():
    payment = Payment(payment_status=PaymentStatus.pending)

    assert transition_payment_status(payment, PaymentStatus.completed) is True
    assert payment.payment_status == PaymentStatus.completed
    assert transition_payment_status(payment, PaymentStatus.failed) is False
    assert payment.payment_status == PaymentStatus.completed
    assert transition_payment_status(payment, PaymentStatus.refunded) is True
    assert payment.payment_status == PaymentStatus.refunded
    assert transition_payment_status(payment, PaymentStatus.completed) is False


def test_failed_intent_can_succeed_after_customer_retry():
    payment = Payment(payment_status=PaymentStatus.pending)

    assert transition_payment_status(payment, PaymentStatus.failed) is True
    assert transition_payment_status(payment, PaymentStatus.completed) is True
    assert payment.payment_status == PaymentStatus.completed
