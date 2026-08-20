from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import HomeSlide
from app.schemas.slide import HomeSlideCreate, HomeSlideUpdate


class HomeSlideRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_all(self, include_inactive: bool = False) -> list[HomeSlide]:
        stmt = select(HomeSlide)
        if not include_inactive:
            stmt = stmt.where(HomeSlide.is_active == True)
        stmt = stmt.order_by(HomeSlide.sort_order.asc(), HomeSlide.id.asc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id(self, slide_id: int, include_inactive: bool = False) -> Optional[HomeSlide]:
        stmt = select(HomeSlide).where(HomeSlide.id == slide_id)
        if not include_inactive:
            stmt = stmt.where(HomeSlide.is_active == True)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def create(self, slide_in: HomeSlideCreate) -> HomeSlide:
        slide = HomeSlide(**slide_in.model_dump())
        self.session.add(slide)
        await self.session.flush()
        return slide

    async def update(self, slide: HomeSlide, slide_in: HomeSlideUpdate) -> HomeSlide:
        update_data = slide_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(slide, field, value)
        self.session.add(slide)
        await self.session.flush()
        return slide

    async def delete(self, slide: HomeSlide) -> None:
        await self.session.delete(slide)
        await self.session.flush()
