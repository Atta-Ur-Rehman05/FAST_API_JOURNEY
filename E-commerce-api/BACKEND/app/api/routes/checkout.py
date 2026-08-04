from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import SessionDep, get_current_active_user
from app.models.models import User
from app.schemas.checkout import CheckoutCreate, CheckoutResponse
from app.services.checkout import (
    AddressNotFoundError,
    AddressOwnershipError,
    CartNotFoundError,
    CheckoutService,
    CheckoutServiceError,
    EmptyCartError,
    InsufficientStockError,
    ProductUnavailableError,
    ProductVariantNotFoundError,
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

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Unexpected checkout service error.",
    )


@router.post("/", response_model=CheckoutResponse, status_code=status.HTTP_201_CREATED)
async def checkout(
    checkout_in: CheckoutCreate,
    session: SessionDep,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    checkout_service = CheckoutService(session)
    try:
        order, payment = await checkout_service.checkout(current_user.id, checkout_in)
        return {"order": order, "payment": payment}
    except CheckoutServiceError as error:
        _raise_checkout_http_error(error)
