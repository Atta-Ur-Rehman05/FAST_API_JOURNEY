from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import SessionDep, get_current_active_user
from app.models.models import User
from app.schemas.wishlist import WishlistItemCreate, WishlistItemResponse, WishlistResponse
from app.services.wishlist import (
    DuplicateWishlistItemError,
    WishlistItemNotFoundError,
    WishlistNotFoundError,
    WishlistService,
    WishlistServiceError,
)


router = APIRouter()


def _raise_wishlist_http_error(error: WishlistServiceError) -> None:
    if isinstance(error, WishlistNotFoundError):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error.detail)
    if isinstance(error, (WishlistItemNotFoundError, DuplicateWishlistItemError)):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error.detail)
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unexpected wishlist error.")


@router.get("/", response_model=WishlistResponse)
async def get_wishlist(
    session: SessionDep,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    service = WishlistService(session)
    return await service.get_user_wishlist(current_user.id)


@router.get("/items", response_model=list[WishlistItemResponse])
async def list_wishlist_items(
    session: SessionDep,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    service = WishlistService(session)
    try:
        return await service.list_items(current_user.id)
    except WishlistServiceError as error:
        _raise_wishlist_http_error(error)


@router.post("/items", response_model=WishlistItemResponse, status_code=status.HTTP_201_CREATED)
async def add_wishlist_item(
    item_in: WishlistItemCreate,
    session: SessionDep,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    service = WishlistService(session)
    try:
        return await service.add_item(current_user.id, item_in.product_id)
    except WishlistServiceError as error:
        _raise_wishlist_http_error(error)


@router.delete("/items/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_wishlist_item(
    product_id: UUID,
    session: SessionDep,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    service = WishlistService(session)
    try:
        await service.remove_item(current_user.id, product_id)
    except WishlistServiceError as error:
        _raise_wishlist_http_error(error)


@router.delete("/clear", status_code=status.HTTP_204_NO_CONTENT)
async def clear_wishlist(
    session: SessionDep,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    service = WishlistService(session)
    try:
        await service.clear_wishlist(current_user.id)
    except WishlistServiceError as error:
        _raise_wishlist_http_error(error)
