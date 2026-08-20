from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.dependencies import SessionDep, get_current_admin_user, get_current_active_user
from app.models.models import User
from app.schemas.blog import BlogCreate, BlogResponse, BlogUpdate
from app.schemas.pagination import PaginatedResponse
from app.services.blog import (
    BlogNotFoundError,
    DuplicateBlogSlugError,
    BlogService,
    BlogServiceError,
)

router = APIRouter()


def _raise_blog_http_error(error: BlogServiceError) -> None:
    if isinstance(error, BlogNotFoundError):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error.detail)
    if isinstance(error, DuplicateBlogSlugError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error.detail)
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error.detail)


@router.get("/", response_model=PaginatedResponse[BlogResponse])
async def list_blogs(
    session: SessionDep,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
    _: Annotated[User, Depends(get_current_active_user)] = None,
):
    service = BlogService(session)
    return await service.list_blogs(skip=skip, limit=limit, include_unpublished=True)


@router.get("/public", response_model=PaginatedResponse[BlogResponse])
async def list_public_blogs(
    session: SessionDep,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
):
    service = BlogService(session)
    return await service.list_blogs(skip=skip, limit=limit, include_unpublished=False)


@router.get("/{blog_id}", response_model=BlogResponse)
async def get_blog(
    blog_id: int,
    session: SessionDep,
    _: Annotated[User, Depends(get_current_active_user)] = None,
):
    service = BlogService(session)
    try:
        return await service.get_blog(blog_id, include_unpublished=True)
    except BlogServiceError as error:
        _raise_blog_http_error(error)


@router.get("/public/{blog_id}", response_model=BlogResponse)
async def get_public_blog(blog_id: int, session: SessionDep):
    service = BlogService(session)
    try:
        return await service.get_blog(blog_id, include_unpublished=False)
    except BlogServiceError as error:
        _raise_blog_http_error(error)


@router.post("/", response_model=BlogResponse, status_code=status.HTTP_201_CREATED)
async def create_blog(
    blog_in: BlogCreate,
    session: SessionDep,
    _: Annotated[User, Depends(get_current_admin_user)],
):
    service = BlogService(session)
    try:
        return await service.create_blog(blog_in)
    except BlogServiceError as error:
        _raise_blog_http_error(error)


@router.patch("/{blog_id}", response_model=BlogResponse)
async def update_blog(
    blog_id: int,
    blog_in: BlogUpdate,
    session: SessionDep,
    _: Annotated[User, Depends(get_current_admin_user)],
):
    service = BlogService(session)
    try:
        return await service.update_blog(blog_id, blog_in)
    except BlogServiceError as error:
        _raise_blog_http_error(error)


@router.delete("/{blog_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_blog(
    blog_id: int,
    session: SessionDep,
    _: Annotated[User, Depends(get_current_admin_user)],
):
    service = BlogService(session)
    try:
        await service.delete_blog(blog_id)
    except BlogServiceError as error:
        _raise_blog_http_error(error)
