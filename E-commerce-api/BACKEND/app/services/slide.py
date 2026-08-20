from typing import List

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import HomeSlide
from app.repositories.slide import HomeSlideRepository
from app.schemas.slide import HomeSlideCreate, HomeSlideUpdate


class HomeSlideServiceError(Exception):
    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)


class HomeSlideNotFoundError(HomeSlideServiceError):
    pass


class HomeSlideService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = HomeSlideRepository(session)

    async def list_slides(self, *, include_inactive: bool = False) -> List[HomeSlide]:
        return await self.repo.get_all(include_inactive=include_inactive)

    async def get_slide(self, slide_id: int, include_inactive: bool = False) -> HomeSlide:
        slide = await self.repo.get_by_id(slide_id, include_inactive=include_inactive)
        if slide is None:
            raise HomeSlideNotFoundError("Home slide not found.")
        return slide

    async def create_slide(self, slide_in: HomeSlideCreate) -> HomeSlide:
        return await self.repo.create(slide_in)

    async def update_slide(self, slide_id: int, slide_in: HomeSlideUpdate) -> HomeSlide:
        slide = await self.get_slide(slide_id, include_inactive=True)
        return await self.repo.update(slide, slide_in)

    async def delete_slide(self, slide_id: int) -> None:
        slide = await self.get_slide(slide_id, include_inactive=True)
        await self.repo.delete(slide)
