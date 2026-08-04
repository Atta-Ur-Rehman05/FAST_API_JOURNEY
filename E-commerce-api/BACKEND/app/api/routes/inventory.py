from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.dependencies import SessionDep, get_current_admin_user
from app.models.models import User
from app.schemas.inventory import (
    InventoryAdjustmentResponse,
    InventoryResponse,
    InventoryStockAdjustment,
    InventoryStockSet,
)
from app.services.inventory import (
    InsufficientInventoryError,
    InventoryService,
    InventoryServiceError,
    InventoryVariantNotFoundError,
)

router = APIRouter()


def _raise_inventory_http_error(error: InventoryServiceError) -> None:
    if isinstance(error, InventoryVariantNotFoundError):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error.detail)

    if isinstance(error, InsufficientInventoryError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error.detail)

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Unexpected inventory service error.",
    )


@router.get("/", response_model=list[InventoryResponse])
async def list_inventory(
    session: SessionDep,
    _: Annotated[User, Depends(get_current_admin_user)],
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
    search: str | None = None,
    product_id: UUID | None = None,
    low_stock_threshold: Annotated[int, Query(ge=0)] = 5,
    low_stock_only: bool = False,
    out_of_stock_only: bool = False,
):
    inventory_service = InventoryService(session)
    return await inventory_service.list_inventory(
        skip=skip,
        limit=limit,
        search=search,
        product_id=product_id,
        low_stock_threshold=low_stock_threshold,
        low_stock_only=low_stock_only,
        out_of_stock_only=out_of_stock_only,
    )


@router.get("/sku/{sku}", response_model=InventoryResponse)
async def get_inventory_by_sku(
    sku: str,
    session: SessionDep,
    _: Annotated[User, Depends(get_current_admin_user)],
    low_stock_threshold: Annotated[int, Query(ge=0)] = 5,
):
    inventory_service = InventoryService(session)
    try:
        return await inventory_service.get_inventory_by_sku(sku, low_stock_threshold)
    except InventoryServiceError as error:
        _raise_inventory_http_error(error)


@router.get("/{variant_id}", response_model=InventoryResponse)
async def get_inventory(
    variant_id: UUID,
    session: SessionDep,
    _: Annotated[User, Depends(get_current_admin_user)],
    low_stock_threshold: Annotated[int, Query(ge=0)] = 5,
):
    inventory_service = InventoryService(session)
    try:
        return await inventory_service.get_inventory(variant_id, low_stock_threshold)
    except InventoryServiceError as error:
        _raise_inventory_http_error(error)


@router.patch("/{variant_id}/stock", response_model=InventoryAdjustmentResponse)
async def set_stock(
    variant_id: UUID,
    stock_in: InventoryStockSet,
    session: SessionDep,
    _: Annotated[User, Depends(get_current_admin_user)],
    low_stock_threshold: Annotated[int, Query(ge=0)] = 5,
):
    inventory_service = InventoryService(session)
    try:
        return await inventory_service.set_stock(
            variant_id,
            stock_in.stock_quantity,
            reason=stock_in.reason,
            low_stock_threshold=low_stock_threshold,
        )
    except InventoryServiceError as error:
        _raise_inventory_http_error(error)


@router.post("/{variant_id}/restock", response_model=InventoryAdjustmentResponse)
async def restock_inventory(
    variant_id: UUID,
    adjustment_in: InventoryStockAdjustment,
    session: SessionDep,
    _: Annotated[User, Depends(get_current_admin_user)],
    low_stock_threshold: Annotated[int, Query(ge=0)] = 5,
):
    inventory_service = InventoryService(session)
    try:
        return await inventory_service.restock(
            variant_id,
            adjustment_in.quantity,
            reason=adjustment_in.reason,
            low_stock_threshold=low_stock_threshold,
        )
    except InventoryServiceError as error:
        _raise_inventory_http_error(error)


@router.post("/{variant_id}/deduct", response_model=InventoryAdjustmentResponse)
async def deduct_inventory(
    variant_id: UUID,
    adjustment_in: InventoryStockAdjustment,
    session: SessionDep,
    _: Annotated[User, Depends(get_current_admin_user)],
    low_stock_threshold: Annotated[int, Query(ge=0)] = 5,
):
    inventory_service = InventoryService(session)
    try:
        return await inventory_service.deduct(
            variant_id,
            adjustment_in.quantity,
            reason=adjustment_in.reason,
            low_stock_threshold=low_stock_threshold,
        )
    except InventoryServiceError as error:
        _raise_inventory_http_error(error)


@router.post("/{variant_id}/release", response_model=InventoryAdjustmentResponse)
async def release_inventory(
    variant_id: UUID,
    adjustment_in: InventoryStockAdjustment,
    session: SessionDep,
    _: Annotated[User, Depends(get_current_admin_user)],
    low_stock_threshold: Annotated[int, Query(ge=0)] = 5,
):
    inventory_service = InventoryService(session)
    try:
        return await inventory_service.release(
            variant_id,
            adjustment_in.quantity,
            reason=adjustment_in.reason,
            low_stock_threshold=low_stock_threshold,
        )
    except InventoryServiceError as error:
        _raise_inventory_http_error(error)
