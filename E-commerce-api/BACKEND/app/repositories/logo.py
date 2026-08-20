from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import SiteLogo
from app.schemas.logo import SiteLogoCreate, SiteLogoUpdate


class SiteLogoRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_single(self) -> Optional[SiteLogo]:
        result = await self.session.execute(select(SiteLogo).limit(1))
        return result.scalars().first()

    async def create(self, logo_in: SiteLogoCreate) -> SiteLogo:
        logo = SiteLogo(**logo_in.model_dump())
        self.session.add(logo)
        await self.session.flush()
        return logo

    async def update(self, logo: SiteLogo, logo_in: SiteLogoUpdate) -> SiteLogo:
        update_data = logo_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(logo, field, value)
        self.session.add(logo)
        await self.session.flush()
        return logo
