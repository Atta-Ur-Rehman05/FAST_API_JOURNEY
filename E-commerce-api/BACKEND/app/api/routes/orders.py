from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.dependencies import (
    SessionDep,
    get_current_active_user,
    get_current_admin_user,
)
from app.models.models import RoleType, User
from app.schemas.order import (
    OrderCreate,
    OrderItemCreate,
    OrderItemResponse,
    OrderItemUpdate,
    OrderResponse,
    OrderStatusUpdate,
    OrderUpdate,
)
from app.schemas.pagination import PaginatedResponse
from app.services.order import (
    AddressNotFoundError,
    AddressOwnershipError,
    InsufficientStockError,
    InvalidOrderTransitionError,
    OrderDeletionNotAllowedError,
    OrderNotEditableError,
    OrderItemNotFoundError,
    OrderItemOwnershipError,
    OrderNotFoundError,
    OrderOwnershipError,
    OrderService,
    OrderServiceError,
    ProductUnavailableError,
    ProductVariantNotFoundError,
    RefundRequiredError,
)

router = APIRouter()


def _raise_order_http_error(error: OrderServiceError) -> None:
    if isinstance(
        error,
        (
            AddressNotFoundError,
            OrderItemNotFoundError,
            OrderNotFoundError,
            ProductVariantNotFoundError,
        ),
    ):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error.detail)

    if isinstance(
        error,
        (
            AddressOwnershipError,
            InsufficientStockError,
            OrderItemOwnershipError,
            ProductUnavailableError,
        ),
    ):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error.detail)

    if isinstance(error, OrderOwnershipError):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=error.detail)

    if isinstance(
        error,
        (
            InvalidOrderTransitionError,
            OrderDeletionNotAllowedError,
            OrderNotEditableError,
            RefundRequiredError,
        ),
    ):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=error.detail)

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Unexpected order service error.",
    )


@router.get("/", response_model=PaginatedResponse[OrderResponse])
async def list_orders(
    session: SessionDep,
    _: Annotated[User, Depends(get_current_admin_user)],
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
    search: str | None = None,
):
    order_service = OrderService(session)
    items = await order_service.list_orders(skip=skip, limit=limit, search=search)
    total = await order_service.count_orders(search=search)
    return PaginatedResponse.create(items=items, total=total, skip=skip, limit=limit)


@router.get("/me", response_model=PaginatedResponse[OrderResponse])
async def list_my_orders(
    session: SessionDep,
    current_user: Annotated[User, Depends(get_current_active_user)],
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
):
    order_service = OrderService(session)
    items = await order_service.list_orders(
        skip=skip,
        limit=limit,
        user_id=current_user.id,
    )
    total = await order_service.count_orders(user_id=current_user.id)
    return PaginatedResponse.create(items=items, total=total, skip=skip, limit=limit)


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_in: OrderCreate,
    session: SessionDep,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    order_service = OrderService(session)
    try:
        return await order_service.create_order(current_user.id, order_in)
    except OrderServiceError as error:
        _raise_order_http_error(error)


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: UUID,
    session: SessionDep,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    order_service = OrderService(session)
    try:
        if current_user.role == RoleType.admin:
            return await order_service.get_order(order_id)

        return await order_service.get_user_order(current_user.id, order_id)
    except OrderServiceError as error:
        _raise_order_http_error(error)


@router.patch("/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: UUID,
    order_in: OrderUpdate,
    session: SessionDep,
    _: Annotated[User, Depends(get_current_admin_user)],
):
    order_service = OrderService(session)
    try:
        return await order_service.update_order(order_id, order_in)
    except OrderServiceError as error:
        _raise_order_http_error(error)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(
    order_id: UUID,
    session: SessionDep,
    _: Annotated[User, Depends(get_current_admin_user)],
):
    order_service = OrderService(session)
    try:
        await order_service.delete_order(order_id)
    except OrderServiceError as error:
        _raise_order_http_error(error)


@router.patch("/{order_id}/status", response_model=OrderResponse)
async def transition_order_status(
    order_id: UUID,
    status_in: OrderStatusUpdate,
    session: SessionDep,
    _: Annotated[User, Depends(get_current_admin_user)],
):
    order_service = OrderService(session)
    try:
        return await order_service.transition_status(order_id, status_in.order_status)
    except OrderServiceError as error:
        _raise_order_http_error(error)


@router.post("/{order_id}/cancel", response_model=OrderResponse)
async def request_cancellation(
    order_id: UUID,
    session: SessionDep,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    order_service = OrderService(session)
    try:
        return await order_service.request_cancellation(current_user.id, order_id)
    except OrderServiceError as error:
        _raise_order_http_error(error)


@router.post(
    "/{order_id}/items",
    response_model=OrderItemResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_order_item(
    order_id: UUID,
    item_in: OrderItemCreate,
    session: SessionDep,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    order_service = OrderService(session)
    try:
        return await order_service.add_item(current_user.id, order_id, item_in)
    except OrderServiceError as error:
        _raise_order_http_error(error)


@router.patch("/{order_id}/items/{item_id}", response_model=OrderItemResponse)
async def update_order_item(
    order_id: UUID,
    item_id: int,
    item_in: OrderItemUpdate,
    session: SessionDep,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    order_service = OrderService(session)
    try:
        return await order_service.update_item(
            current_user.id,
            order_id,
            item_id,
            item_in,
        )
    except OrderServiceError as error:
        _raise_order_http_error(error)


@router.delete("/{order_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order_item(
    order_id: UUID,
    item_id: int,
    session: SessionDep,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    order_service = OrderService(session)
    try:
        await order_service.delete_item(current_user.id, order_id, item_id)
    except OrderServiceError as error:
        _raise_order_http_error(error)
