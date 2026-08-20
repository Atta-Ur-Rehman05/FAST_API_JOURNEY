from typing import List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Blog
from app.repositories.blog import BlogRepository
from app.schemas.blog import BlogCreate, BlogUpdate
from app.schemas.pagination import PaginatedResponse


class BlogServiceError(Exception):
    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)


class BlogNotFoundError(BlogServiceError):
    pass


class DuplicateBlogSlugError(BlogServiceError):
    pass


class BlogService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = BlogRepository(session)

    async def list_blogs(
        self, *, skip: int = 0, limit: int = 100, include_unpublished: bool = False
    ) -> PaginatedResponse:
        items, total = await self.repo.list_paginated(
            skip=skip, limit=limit, include_unpublished=include_unpublished
        )
        return PaginatedResponse.create(items=items, total=total, skip=skip, limit=limit)

    async def get_blog(self, blog_id: int, include_unpublished: bool = False) -> Blog:
        blog = await self.repo.get_by_id(blog_id, include_unpublished=include_unpublished)
        if blog is None:
            raise BlogNotFoundError("Blog not found.")
        return blog

    async def create_blog(self, blog_in: BlogCreate) -> Blog:
        existing = await self.repo.get_by_slug(blog_in.slug, include_unpublished=True)
        if existing:
            raise DuplicateBlogSlugError("A blog with this slug already exists.")
        return await self.repo.create(blog_in)

    async def update_blog(self, blog_id: int, blog_in: BlogUpdate) -> Blog:
        blog = await self.repo.get_by_id(blog_id, include_unpublished=True)
        if blog is None:
            raise BlogNotFoundError("Blog not found.")
        if blog_in.slug is not None:
            existing = await self.repo.get_by_slug(blog_in.slug, include_unpublished=True)
            if existing and existing.id != blog_id:
                raise DuplicateBlogSlugError("A blog with this slug already exists.")
        return await self.repo.update(blog, blog_in)

    async def delete_blog(self, blog_id: int) -> None:
        blog = await self.repo.get_by_id(blog_id, include_unpublished=True)
        if blog is None:
            raise BlogNotFoundError("Blog not found.")
        await self.repo.delete(blog)
