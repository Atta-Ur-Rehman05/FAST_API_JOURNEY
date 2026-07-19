from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Review
from app.repositories.product import ProductRepository
from app.repositories.review import ReviewRepository
from app.schemas.review import ReviewCreate, ReviewUpdate


class ReviewServiceError(Exception):
    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)


class ReviewNotFoundError(ReviewServiceError):
    pass


class ProductNotFoundError(ReviewServiceError):
    pass


class DuplicateReviewError(ReviewServiceError):
    pass


class ReviewOwnershipError(ReviewServiceError):
    pass


class ReviewService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.review_repo = ReviewRepository(session)
        self.product_repo = ProductRepository(session)

    async def list_reviews(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
        product_id: Optional[UUID] = None,
        user_id: Optional[UUID] = None,
    ) -> list[Review]:
        return await self.review_repo.list(
            skip=skip, limit=limit, product_id=product_id, user_id=user_id
        )

    async def get_review(self, review_id: UUID) -> Review:
        review = await self.review_repo.get_by_id(review_id)
        if review is None:
            raise ReviewNotFoundError("Review not found.")
        return review

    async def create_review(self, user_id: UUID, review_in: ReviewCreate) -> Review:
        # Validate product exists
        product = await self.product_repo.get_by_id(review_in.product_id)
        if product is None:
            raise ProductNotFoundError("Product not found.")

        # Check for existing review by this user on this product
        existing_review = await self.review_repo.get_by_product_and_user(
            product_id=review_in.product_id, user_id=user_id
        )
        if existing_review:
            raise DuplicateReviewError("You have already reviewed this product.")

        return await self.review_repo.create(user_id, review_in)

    async def update_review(
        self, review_id: UUID, user_id: UUID, review_in: ReviewUpdate
    ) -> Review:
        review = await self.get_review(review_id)
        if review.user_id != user_id:
            raise ReviewOwnershipError("You can only update your own reviews.")

        return await self.review_repo.update(review, review_in)

    async def delete_review(self, review_id: UUID, user_id: UUID) -> None:
        review = await self.get_review(review_id)
        if review.user_id != user_id:
            raise ReviewOwnershipError("You can only delete your own reviews.")

        await self.review_repo.delete(review)

    async def admin_delete_review(self, review_id: UUID) -> None:
        """Allow admins to delete any review without ownership checks."""
        review = await self.get_review(review_id)
        await self.review_repo.delete(review)
