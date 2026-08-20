from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import SiteLogo
from app.repositories.logo import SiteLogoRepository
from app.schemas.logo import SiteLogoCreate, SiteLogoUpdate


class SiteLogoServiceError(Exception):
    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)


class SiteLogoService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = SiteLogoRepository(session)

    async def get_logo(self) -> SiteLogo | None:
        return await self.repo.get_single()

    async def create_or_update_logo(self, logo_in: SiteLogoCreate | SiteLogoUpdate) -> SiteLogo:
        existing = await self.repo.get_single()
        if existing:
            update_data = logo_in.model_dump(exclude_unset=True) if isinstance(logo_in, SiteLogoUpdate) else logo_in.model_dump()
            return await self.repo.update(existing, SiteLogoUpdate(**update_data))
        data = logo_in.model_dump()
        return await self.repo.create(SiteLogoCreate(**data))
