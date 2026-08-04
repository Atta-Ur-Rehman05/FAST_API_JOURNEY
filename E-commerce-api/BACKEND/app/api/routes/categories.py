from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.dependencies import SessionDep, get_current_admin_user
from app.models.models import User
from app.schemas.category import (
    CategoryCreate,
    CategoryResponse,
    CategoryTreeResponse,
    CategoryUpdate,
)
from app.services.category import (
    CategoryDeleteRestrictedError,
    CategoryNotFoundError,
    CategoryService,
    CategoryServiceError,
    DuplicateCategorySlugError,
    InvalidCategoryParentError,
    ParentCategoryNotFoundError,
)

router = APIRouter()


def _raise_category_http_error(error: CategoryServiceError) -> None:
    if isinstance(error, (CategoryNotFoundError, ParentCategoryNotFoundError)):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error.detail)

    if isinstance(
        error,
        (
            CategoryDeleteRestrictedError,
            DuplicateCategorySlugError,
            InvalidCategoryParentError,
        ),
    ):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error.detail)

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Unexpected category service error.",
    )


@router.get("/", response_model=list[CategoryResponse])
async def list_categories(
    session: SessionDep,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
    parent_id: Optional[int] = None,
    root_only: bool = False,
    search: Optional[str] = None,
):
    category_service = CategoryService(session)
    return await category_service.list_categories(
        skip=skip,
        limit=limit,
        parent_id=parent_id,
        root_only=root_only,
        search=search,
    )


@router.get("/tree", response_model=list[CategoryTreeResponse])
async def get_category_tree(session: SessionDep):
    category_service = CategoryService(session)
    return await category_service.get_category_tree()


@router.post(
    "/",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_category(
    category_in: CategoryCreate,
    session: SessionDep,
    _: Annotated[User, Depends(get_current_admin_user)],
):
    category_service = CategoryService(session)
    try:
        return await category_service.create_category(category_in)
    except CategoryServiceError as error:
        _raise_category_http_error(error)


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(category_id: int, session: SessionDep):
    category_service = CategoryService(session)
    try:
        return await category_service.get_category(category_id)
    except CategoryServiceError as error:
        _raise_category_http_error(error)


@router.patch("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    category_in: CategoryUpdate,
    session: SessionDep,
    _: Annotated[User, Depends(get_current_admin_user)],
):
    category_service = CategoryService(session)
    try:
        return await category_service.update_category(category_id, category_in)
    except CategoryServiceError as error:
        _raise_category_http_error(error)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    session: SessionDep,
    _: Annotated[User, Depends(get_current_admin_user)],
):
    category_service = CategoryService(session)
    try:
        await category_service.delete_category(category_id)
    except CategoryServiceError as error:
        _raise_category_http_error(error)
