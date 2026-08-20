from typing import Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Banner
from app.schemas.banner import BannerCreate, BannerUpdate


class BannerRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_all(self) -> list[Banner]:
        result = await self.session.execute(
            select(Banner).order_by(Banner.sort_order.asc(), Banner.id.asc())
        )
        return list(result.scalars().all())

    async def get_by_id(self, banner_id: int) -> Optional[Banner]:
        result = await self.session.execute(
            select(Banner).where(Banner.id == banner_id)
        )
        return result.scalars().first()

    async def create(self, banner_in: BannerCreate) -> Banner:
        banner = Banner(**banner_in.model_dump())
        self.session.add(banner)
        await self.session.flush()
        return banner

    async def update(self, banner: Banner, banner_in: BannerUpdate) -> Banner:
        update_data = banner_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(banner, field, value)
        self.session.add(banner)
        await self.session.flush()
        return banner

    async def delete(self, banner: Banner) -> None:
        await self.session.delete(banner)
        await self.session.flush()
