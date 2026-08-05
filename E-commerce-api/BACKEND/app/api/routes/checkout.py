from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, status

from app.api.dependencies import SessionDep, get_current_active_user
from app.models.models import User
from app.models.models import PaymentMethod
from app.schemas.checkout import CheckoutCreate, CheckoutResponse
from app.services.checkout import (
    AddressNotFoundError,
    AddressOwnershipError,
    CartNotFoundError,
    CheckoutService,
    CheckoutServiceError,
    EmptyCartError,
    IdempotencyConflictError,
    InsufficientStockError,
    ProductUnavailableError,
    ProductVariantNotFoundError,
)
from app.services.stripe import (
    StripeGatewayError,
    StripeNotConfiguredError,
    create_payment_intent,
)

router = APIRouter()


def _raise_checkout_http_error(error: CheckoutServiceError) -> None:
    if isinstance(
        error,
        (AddressNotFoundError, CartNotFoundError, ProductVariantNotFoundError),
    ):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error.detail)

    if isinstance(
        error,
        (
            AddressOwnershipError,
            EmptyCartError,
            InsufficientStockError,
            ProductUnavailableError,
        ),
    ):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error.detail)

    if isinstance(error, IdempotencyConflictError):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=error.detail)

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Unexpected checkout service error.",
    )


@router.post("/", response_model=CheckoutResponse, status_code=status.HTTP_201_CREATED)
async def checkout(
    checkout_in: CheckoutCreate,
    session: SessionDep,
    current_user: Annotated[User, Depends(get_current_active_user)],
    idempotency_key: Annotated[
        str | None, Header(alias="Idempotency-Key", max_length=255)
    ] = None,
):
    checkout_service = CheckoutService(session)
    try:
        order, payment = await checkout_service.checkout(
            current_user.id, checkout_in, idempotency_key
        )
        stripe_client_secret = None
        if payment.payment_method == PaymentMethod.stripe:
            intent = await create_payment_intent(
                amount=payment.amount, order_id=order.id, payment_id=payment.id
            )
            # The provider-generated ID is the only transaction identifier
            # trusted by this API.
            if payment.transaction_id != intent.id:
                payment.transaction_id = intent.id
                session.add(payment)
                await session.commit()
            stripe_client_secret = intent.client_secret
        return {
            "order": order,
            "payment": payment,
            "stripe_client_secret": stripe_client_secret,
        }
    except CheckoutServiceError as error:
        _raise_checkout_http_error(error)
    except StripeNotConfiguredError as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(error))
    except StripeGatewayError as error:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(error))
