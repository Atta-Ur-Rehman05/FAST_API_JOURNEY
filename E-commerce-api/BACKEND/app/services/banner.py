from typing import List

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Banner
from app.repositories.banner import BannerRepository
from app.schemas.banner import BannerCreate, BannerUpdate


class BannerServiceError(Exception):
    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)


class BannerNotFoundError(BannerServiceError):
    pass


class BannerService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = BannerRepository(session)

    async def list_banners(self, *, include_inactive: bool = False) -> List[Banner]:
        return await self.repo.get_all()

    async def get_banner(self, banner_id: int) -> Banner:
        banner = await self.repo.get_by_id(banner_id)
        if banner is None:
            raise BannerNotFoundError("Banner not found.")
        return banner

    async def create_banner(self, banner_in: BannerCreate) -> Banner:
        return await self.repo.create(banner_in)

    async def update_banner(self, banner_id: int, banner_in: BannerUpdate) -> Banner:
        banner = await self.get_banner(banner_id)
        return await self.repo.update(banner, banner_in)

    async def delete_banner(self, banner_id: int) -> None:
        banner = await self.get_banner(banner_id)
        await self.repo.delete(banner)
