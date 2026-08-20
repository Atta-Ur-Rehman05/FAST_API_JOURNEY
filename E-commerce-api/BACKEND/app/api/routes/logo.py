from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import SessionDep, get_current_admin_user, get_current_active_user
from app.models.models import User
from app.schemas.logo import SiteLogoCreate, SiteLogoResponse, SiteLogoUpdate
from app.services.logo import SiteLogoService, SiteLogoServiceError

router = APIRouter()


@router.get("/", response_model=SiteLogoResponse)
async def get_logo(session: SessionDep):
    service = SiteLogoService(session)
    logo = await service.get_logo()
    if logo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Logo not configured.")
    return logo


@router.put("/", response_model=SiteLogoResponse)
async def upsert_logo(
    logo_in: SiteLogoCreate,
    session: SessionDep,
    _: Annotated[User, Depends(get_current_admin_user)],
):
    service = SiteLogoService(session)
    return await service.create_or_update_logo(logo_in)
