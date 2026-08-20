from typing import Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Blog
from app.schemas.blog import BlogCreate, BlogUpdate


class BlogRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_all(self, include_unpublished: bool = False) -> list[Blog]:
        stmt = select(Blog)
        if not include_unpublished:
            stmt = stmt.where(Blog.is_published == True)
        stmt = stmt.order_by(Blog.created_at.desc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id(self, blog_id: int, include_unpublished: bool = False) -> Optional[Blog]:
        stmt = select(Blog).where(Blog.id == blog_id)
        if not include_unpublished:
            stmt = stmt.where(Blog.is_published == True)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_by_slug(self, slug: str, include_unpublished: bool = False) -> Optional[Blog]:
        stmt = select(Blog).where(Blog.slug == slug)
        if not include_unpublished:
            stmt = stmt.where(Blog.is_published == True)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def list_paginated(self, *, skip: int = 0, limit: int = 100, include_unpublished: bool = False) -> tuple[list[Blog], int]:
        base_stmt = select(Blog)
        count_stmt = select(func.count(Blog.id))
        if not include_unpublished:
            base_stmt = base_stmt.where(Blog.is_published == True)
            count_stmt = count_stmt.where(Blog.is_published == True)
        total = (await self.session.execute(count_stmt)).scalar_one()
        result = await self.session.execute(
            base_stmt.order_by(Blog.created_at.desc()).offset(skip).limit(limit)
        )
        items = list(result.scalars().all())
        return items, total

    async def create(self, blog_in: BlogCreate) -> Blog:
        blog = Blog(**blog_in.model_dump())
        self.session.add(blog)
        await self.session.flush()
        return blog

    async def update(self, blog: Blog, blog_in: BlogUpdate) -> Blog:
        update_data = blog_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(blog, field, value)
        self.session.add(blog)
        await self.session.flush()
        return blog

    async def delete(self, blog: Blog) -> None:
        await self.session.delete(blog)
        await self.session.flush()
