from typing import Annotated, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.dependencies import SessionDep, get_current_admin_user
from app.models.models import User
from app.schemas.product import (
    ProductCreate,
    ProductImageCreate,
    ProductImageResponse,
    ProductImageUpdate,
    ProductResponse,
    ProductUpdate,
    ProductVariantCreate,
    ProductVariantResponse,
    ProductVariantUpdate,
)
from app.services.product import (
    DuplicateProductSlugError,
    DuplicateProductVariantSkuError,
    ProductCategoryNotFoundError,
    ProductImageNotFoundError,
    ProductNotFoundError,
    ProductOwnershipError,
    ProductService,
    ProductServiceError,
    ProductVariantNotFoundError,
)

router = APIRouter()


def _raise_product_http_error(error: ProductServiceError) -> None:
    if isinstance(
        error,
        (
            ProductCategoryNotFoundError,
            ProductImageNotFoundError,
            ProductNotFoundError,
            ProductVariantNotFoundError,
        ),
    ):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error.detail)

    if isinstance(
        error,
        (
            DuplicateProductSlugError,
            DuplicateProductVariantSkuError,
            ProductOwnershipError,
        ),
    ):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error.detail)

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Unexpected product service error.",
    )


@router.get("/", response_model=list[ProductResponse])
async def list_products(
    session: SessionDep,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
    category_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
):
    product_service = ProductService(session)
    return await product_service.list_products(
        skip=skip,
        limit=limit,
        category_id=category_id,
        is_active=is_active,
        search=search,
    )


@router.post(
    "/",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_product(
    product_in: ProductCreate,
    session: SessionDep,
    _: Annotated[User, Depends(get_current_admin_user)],
):
    product_service = ProductService(session)
    try:
        return await product_service.create_product(product_in)
    except ProductServiceError as error:
        _raise_product_http_error(error)


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: UUID, session: SessionDep):
    product_service = ProductService(session)
    try:
        return await product_service.get_product(product_id)
    except ProductServiceError as error:
        _raise_product_http_error(error)


@router.patch("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: UUID,
    product_in: ProductUpdate,
    session: SessionDep,
    _: Annotated[User, Depends(get_current_admin_user)],
):
    product_service = ProductService(session)
    try:
        return await product_service.update_product(product_id, product_in)
    except ProductServiceError as error:
        _raise_product_http_error(error)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: UUID,
    session: SessionDep,
    _: Annotated[User, Depends(get_current_admin_user)],
):
    product_service = ProductService(session)
    try:
        await product_service.delete_product(product_id)
    except ProductServiceError as error:
        _raise_product_http_error(error)


@router.post(
    "/{product_id}/variants",
    response_model=ProductVariantResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_product_variant(
    product_id: UUID,
    variant_in: ProductVariantCreate,
    session: SessionDep,
    _: Annotated[User, Depends(get_current_admin_user)],
):
    product_service = ProductService(session)
    try:
        return await product_service.create_variant(product_id, variant_in)
    except ProductServiceError as error:
        _raise_product_http_error(error)


@router.patch(
    "/{product_id}/variants/{variant_id}",
    response_model=ProductVariantResponse,
)
async def update_product_variant(
    product_id: UUID,
    variant_id: UUID,
    variant_in: ProductVariantUpdate,
    session: SessionDep,
    _: Annotated[User, Depends(get_current_admin_user)],
):
    product_service = ProductService(session)
    try:
        return await product_service.update_variant(product_id, variant_id, variant_in)
    except ProductServiceError as error:
        _raise_product_http_error(error)


@router.delete(
    "/{product_id}/variants/{variant_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_product_variant(
    product_id: UUID,
    variant_id: UUID,
    session: SessionDep,
    _: Annotated[User, Depends(get_current_admin_user)],
):
    product_service = ProductService(session)
    try:
        await product_service.delete_variant(product_id, variant_id)
    except ProductServiceError as error:
        _raise_product_http_error(error)


@router.post(
    "/{product_id}/images",
    response_model=ProductImageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_product_image(
    product_id: UUID,
    image_in: ProductImageCreate,
    session: SessionDep,
    _: Annotated[User, Depends(get_current_admin_user)],
):
    product_service = ProductService(session)
    try:
        return await product_service.create_image(product_id, image_in)
    except ProductServiceError as error:
        _raise_product_http_error(error)


@router.patch("/{product_id}/images/{image_id}", response_model=ProductImageResponse)
async def update_product_image(
    product_id: UUID,
    image_id: int,
    image_in: ProductImageUpdate,
    session: SessionDep,
    _: Annotated[User, Depends(get_current_admin_user)],
):
    product_service = ProductService(session)
    try:
        return await product_service.update_image(product_id, image_id, image_in)
    except ProductServiceError as error:
        _raise_product_http_error(error)


@router.delete("/{product_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product_image(
    product_id: UUID,
    image_id: int,
    session: SessionDep,
    _: Annotated[User, Depends(get_current_admin_user)],
):
    product_service = ProductService(session)
    try:
        await product_service.delete_image(product_id, image_id)
    except ProductServiceError as error:
        _raise_product_http_error(error)
