from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import SessionDep, get_current_admin_user
from app.models.models import User
from app.schemas.banner import BannerCreate, BannerResponse, BannerUpdate
from app.services.banner import BannerNotFoundError, BannerService, BannerServiceError

router = APIRouter()


def _raise_banner_http_error(error: BannerServiceError) -> None:
    if isinstance(error, BannerNotFoundError):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error.detail)
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error.detail)


@router.get("/", response_model=list[BannerResponse])
async def list_banners(session: SessionDep):
    service = BannerService(session)
    return await service.list_banners()


@router.get("/{banner_id}", response_model=BannerResponse)
async def get_banner(banner_id: int, session: SessionDep):
    service = BannerService(session)
    try:
        return await service.get_banner(banner_id)
    except BannerServiceError as error:
        _raise_banner_http_error(error)


@router.post("/", response_model=BannerResponse, status_code=status.HTTP_201_CREATED)
async def create_banner(
    banner_in: BannerCreate,
    session: SessionDep,
    _: Annotated[User, Depends(get_current_admin_user)],
):
    service = BannerService(session)
    return await service.create_banner(banner_in)


@router.patch("/{banner_id}", response_model=BannerResponse)
async def update_banner(
    banner_id: int,
    banner_in: BannerUpdate,
    session: SessionDep,
    _: Annotated[User, Depends(get_current_admin_user)],
):
    service = BannerService(session)
    try:
        return await service.update_banner(banner_id, banner_in)
    except BannerServiceError as error:
        _raise_banner_http_error(error)


@router.delete("/{banner_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_banner(
    banner_id: int,
    session: SessionDep,
    _: Annotated[User, Depends(get_current_admin_user)],
):
    service = BannerService(session)
    try:
        await service.delete_banner(banner_id)
    except BannerServiceError as error:
        _raise_banner_http_error(error)
