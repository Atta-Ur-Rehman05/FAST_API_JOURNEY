from typing import Annotated, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.dependencies import SessionDep, get_current_active_user, get_current_admin_user
from app.models.models import User
from app.schemas.review import ReviewCreate, ReviewResponse, ReviewUpdate
from app.services.review import (
    DuplicateReviewError,
    ProductNotFoundError,
    ReviewNotFoundError,
    ReviewOwnershipError,
    ReviewService,
    ReviewServiceError,
)

router = APIRouter()


def _raise_review_http_error(error: ReviewServiceError) -> None:
    if isinstance(error, (ReviewNotFoundError, ProductNotFoundError)):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error.detail)

    if isinstance(error, (DuplicateReviewError, ReviewOwnershipError)):
        # While 403 might also match OwnershipError, 400 is fine if client made bad request
        status_code = (
            status.HTTP_403_FORBIDDEN
            if isinstance(error, ReviewOwnershipError)
            else status.HTTP_400_BAD_REQUEST
        )
        raise HTTPException(status_code=status_code, detail=error.detail)

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Unexpected review service error.",
    )


@router.get("/", response_model=list[ReviewResponse])
async def list_reviews(
    session: SessionDep,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
    product_id: Optional[UUID] = None,
    user_id: Optional[UUID] = None,
):
    review_service = ReviewService(session)
    return await review_service.list_reviews(
        skip=skip, limit=limit, product_id=product_id, user_id=user_id
    )


@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    review_in: ReviewCreate,
    session: SessionDep,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    review_service = ReviewService(session)
    try:
        return await review_service.create_review(current_user.id, review_in)
    except ReviewServiceError as error:
        _raise_review_http_error(error)


@router.get("/{review_id}", response_model=ReviewResponse)
async def get_review(review_id: UUID, session: SessionDep):
    review_service = ReviewService(session)
    try:
        return await review_service.get_review(review_id)
    except ReviewServiceError as error:
        _raise_review_http_error(error)


@router.patch("/{review_id}", response_model=ReviewResponse)
async def update_review(
    review_id: UUID,
    review_in: ReviewUpdate,
    session: SessionDep,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    review_service = ReviewService(session)
    try:
        return await review_service.update_review(review_id, current_user.id, review_in)
    except ReviewServiceError as error:
        _raise_review_http_error(error)


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: UUID,
    session: SessionDep,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    review_service = ReviewService(session)
    try:
        # Check if admin, else standard delete
        if current_user.role.value == "admin":
            await review_service.admin_delete_review(review_id)
        else:
            await review_service.delete_review(review_id, current_user.id)
    except ReviewServiceError as error:
        _raise_review_http_error(error)
