from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import SessionDep, get_current_admin_user
from app.models.models import User
from app.schemas.slide import HomeSlideCreate, HomeSlideResponse, HomeSlideUpdate
from app.services.slide import HomeSlideNotFoundError, HomeSlideService, HomeSlideServiceError

router = APIRouter()


def _raise_slide_http_error(error: HomeSlideServiceError) -> None:
    if isinstance(error, HomeSlideNotFoundError):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error.detail)
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error.detail)


@router.get("/", response_model=list[HomeSlideResponse])
async def list_slides(session: SessionDep):
    service = HomeSlideService(session)
    return await service.list_slides()


@router.get("/admin/all", response_model=list[HomeSlideResponse])
async def list_all_slides(
    session: SessionDep,
    _: Annotated[User, Depends(get_current_admin_user)],
):
    service = HomeSlideService(session)
    return await service.list_slides(include_inactive=True)


@router.get("/{slide_id}", response_model=HomeSlideResponse)
async def get_slide(slide_id: int, session: SessionDep):
    service = HomeSlideService(session)
    try:
        return await service.get_slide(slide_id)
    except HomeSlideServiceError as error:
        _raise_slide_http_error(error)


@router.post("/", response_model=HomeSlideResponse, status_code=status.HTTP_201_CREATED)
async def create_slide(
    slide_in: HomeSlideCreate,
    session: SessionDep,
    _: Annotated[User, Depends(get_current_admin_user)],
):
    service = HomeSlideService(session)
    return await service.create_slide(slide_in)


@router.patch("/{slide_id}", response_model=HomeSlideResponse)
async def update_slide(
    slide_id: int,
    slide_in: HomeSlideUpdate,
    session: SessionDep,
    _: Annotated[User, Depends(get_current_admin_user)],
):
    service = HomeSlideService(session)
    try:
        return await service.update_slide(slide_id, slide_in)
    except HomeSlideServiceError as error:
        _raise_slide_http_error(error)


@router.delete("/{slide_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_slide(
    slide_id: int,
    session: SessionDep,
    _: Annotated[User, Depends(get_current_admin_user)],
):
    service = HomeSlideService(session)
    try:
        await service.delete_slide(slide_id)
    except HomeSlideServiceError as error:
        _raise_slide_http_error(error)
