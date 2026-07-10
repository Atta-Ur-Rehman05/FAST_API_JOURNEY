from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import SessionDep, get_current_active_user
from app.models.models import User
from app.schemas.cart import CartItemCreate, CartItemResponse, CartItemUpdate, CartResponse
from app.services.cart import (
    CartItemNotFoundError,
    CartItemOwnershipError,
    CartNotFoundError,
    CartService,
    CartServiceError,
    InsufficientStockError,
    ProductUnavailableError,
    ProductVariantNotFoundError,
)

router = APIRouter()


def _raise_cart_http_error(error: CartServiceError) -> None:
    if isinstance(error, (CartItemNotFoundError, CartNotFoundError)):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error.detail)

    if isinstance(error, ProductVariantNotFoundError):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error.detail)

    if isinstance(
        error,
        (CartItemOwnershipError, InsufficientStockError, ProductUnavailableError),
    ):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error.detail)

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Unexpected cart service error.",
    )


@router.get("/me", response_model=CartResponse)
async def get_my_cart(
    session: SessionDep,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    cart_service = CartService(session)
    return await cart_service.get_or_create_cart(current_user.id)


@router.post(
    "/items",
    response_model=CartItemResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_cart_item(
    item_in: CartItemCreate,
    session: SessionDep,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    cart_service = CartService(session)
    try:
        return await cart_service.add_item(current_user.id, item_in)
    except CartServiceError as error:
        _raise_cart_http_error(error)


@router.patch("/items/{item_id}", response_model=CartItemResponse)
async def update_cart_item(
    item_id: int,
    item_in: CartItemUpdate,
    session: SessionDep,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    cart_service = CartService(session)
    try:
        return await cart_service.update_item(current_user.id, item_id, item_in)
    except CartServiceError as error:
        _raise_cart_http_error(error)


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cart_item(
    item_id: int,
    session: SessionDep,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    cart_service = CartService(session)
    try:
        await cart_service.delete_item(current_user.id, item_id)
    except CartServiceError as error:
        _raise_cart_http_error(error)


@router.delete("/items", status_code=status.HTTP_204_NO_CONTENT)
async def clear_my_cart(
    session: SessionDep,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    cart_service = CartService(session)
    try:
        await cart_service.clear_cart(current_user.id)
    except CartServiceError as error:
        _raise_cart_http_error(error)
