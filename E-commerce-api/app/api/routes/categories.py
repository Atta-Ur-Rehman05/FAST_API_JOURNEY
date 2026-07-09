from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.dependencies import SessionDep, get_current_admin_user
from app.models.models import User
from app.repositries.category import CategoryRepository
from app.schemas.category import (
    CategoryCreate,
    CategoryResponse,
    CategoryTreeResponse,
    CategoryUpdate,
)

router = APIRouter()


async def _validate_parent(
    category_repo: CategoryRepository,
    parent_id: Optional[int],
    *,
    category_id: Optional[int] = None,
) -> None:
    if parent_id is None:
        return

    if category_id is not None and parent_id == category_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A category cannot be its own parent.",
        )

    parent = await category_repo.get_by_id(parent_id)
    if parent is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parent category not found.",
        )

    if category_id is not None and await category_repo.would_create_cycle(
        category_id, parent_id
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A category cannot be moved under one of its descendants.",
        )


def _build_category_tree(categories) -> list[CategoryTreeResponse]:
    category_map = {
        category.id: CategoryTreeResponse(
            id=category.id,
            name=category.name,
            slug=category.slug,
            parent_id=category.parent_id,
            children=[],
        )
        for category in categories
    }
    roots = []

    for category in categories:
        node = category_map[category.id]
        if category.parent_id and category.parent_id in category_map:
            category_map[category.parent_id].children.append(node)
        else:
            roots.append(node)

    return roots


@router.get("/", response_model=list[CategoryResponse])
async def list_categories(
    session: SessionDep,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
    parent_id: Optional[int] = None,
    root_only: bool = False,
    search: Optional[str] = None,
):
    category_repo = CategoryRepository(session)
    return await category_repo.list(
        skip=skip,
        limit=limit,
        parent_id=parent_id,
        root_only=root_only,
        search=search,
    )


@router.get("/tree", response_model=list[CategoryTreeResponse])
async def get_category_tree(session: SessionDep):
    category_repo = CategoryRepository(session)
    categories = await category_repo.list_all()
    return _build_category_tree(categories)


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
    category_repo = CategoryRepository(session)

    existing_category = await category_repo.get_by_slug(category_in.slug)
    if existing_category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A category with this slug already exists.",
        )

    await _validate_parent(category_repo, category_in.parent_id)
    return await category_repo.create(category_in)


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(category_id: int, session: SessionDep):
    category_repo = CategoryRepository(session)
    category = await category_repo.get_by_id(category_id)
    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found.",
        )
    return category


@router.patch("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    category_in: CategoryUpdate,
    session: SessionDep,
    _: Annotated[User, Depends(get_current_admin_user)],
):
    category_repo = CategoryRepository(session)
    category = await category_repo.get_by_id(category_id)
    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found.",
        )

    if category_in.slug is not None:
        existing_category = await category_repo.get_by_slug(category_in.slug)
        if existing_category and existing_category.id != category_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A category with this slug already exists.",
            )

    await _validate_parent(
        category_repo,
        category_in.parent_id,
        category_id=category_id,
    )
    return await category_repo.update(category, category_in)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    session: SessionDep,
    _: Annotated[User, Depends(get_current_admin_user)],
):
    category_repo = CategoryRepository(session)
    category = await category_repo.get_by_id(category_id)
    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found.",
        )

    if await category_repo.has_children(category_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a category that has child categories.",
        )

    if await category_repo.has_products(category_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a category that has products.",
        )

    await category_repo.delete(category)
