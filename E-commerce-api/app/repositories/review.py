from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Review
from app.schemas.review import ReviewCreate, ReviewUpdate


class ReviewRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, review_id: UUID) -> Optional[Review]:
        result = await self.session.execute(
            select(Review).where(Review.id == review_id)
        )
        return result.scalars().first()

    async def get_by_product_and_user(self, product_id: UUID, user_id: UUID) -> Optional[Review]:
        result = await self.session.execute(
            select(Review).where(
                Review.product_id == product_id,
                Review.user_id == user_id
            )
        )
        return result.scalars().first()

    async def list(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
        product_id: Optional[UUID] = None,
        user_id: Optional[UUID] = None,
    ) -> list[Review]:
        stmt = (
            select(Review)
            .order_by(Review.created_at.desc())
            .offset(skip)
            .limit(limit)
        )

        if product_id is not None:
            stmt = stmt.where(Review.product_id == product_id)

        if user_id is not None:
            stmt = stmt.where(Review.user_id == user_id)

        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create(self, user_id: UUID, review_in: ReviewCreate) -> Review:
        review = Review(**review_in.model_dump(), user_id=user_id)
        self.session.add(review)
        await self.session.commit()
        await self.session.refresh(review)
        return review

    async def update(self, review: Review, review_in: ReviewUpdate) -> Review:
        update_data = review_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(review, field, value)

        self.session.add(review)
        await self.session.commit()
        await self.session.refresh(review)
        return review

    async def delete(self, review: Review) -> None:
        await self.session.delete(review)
        await self.session.commit()
