from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Category, Product
from app.schemas.category import CategoryCreate, CategoryUpdate


class CategoryRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, category_id: int) -> Optional[Category]:
        result = await self.session.execute(
            select(Category).where(Category.id == category_id)
        )
        return result.scalars().first()

    async def get_by_slug(self, slug: str) -> Optional[Category]:
        result = await self.session.execute(select(Category).where(Category.slug == slug))
        return result.scalars().first()

    async def list(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
        parent_id: Optional[int] = None,
        root_only: bool = False,
        search: Optional[str] = None,
    ) -> list[Category]:
        stmt = select(Category).order_by(Category.name).offset(skip).limit(limit)

        if root_only:
            stmt = stmt.where(Category.parent_id.is_(None))
        elif parent_id is not None:
            stmt = stmt.where(Category.parent_id == parent_id)

        if search:
            stmt = stmt.where(Category.name.ilike(f"%{search}%"))

        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def list_all(self) -> list[Category]:
        result = await self.session.execute(select(Category).order_by(Category.name))
        return list(result.scalars().all())

    async def create(self, category_in: CategoryCreate) -> Category:
        category = Category(**category_in.model_dump())
        self.session.add(category)
        await self.session.commit()
        await self.session.refresh(category)
        return category

    async def update(self, category: Category, category_in: CategoryUpdate) -> Category:
        update_data = category_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(category, field, value)

        self.session.add(category)
        await self.session.commit()
        await self.session.refresh(category)
        return category

    async def delete(self, category: Category) -> None:
        await self.session.delete(category)
        await self.session.commit()

    async def has_children(self, category_id: int) -> bool:
        result = await self.session.execute(
            select(func.count(Category.id)).where(Category.parent_id == category_id)
        )
        return result.scalar_one() > 0

    async def has_products(self, category_id: int) -> bool:
        result = await self.session.execute(
            select(func.count(Product.id)).where(Product.category_id == category_id)
        )
        return result.scalar_one() > 0

    async def would_create_cycle(self, category_id: int, parent_id: int) -> bool:
        current_parent_id = parent_id

        while current_parent_id is not None:
            if current_parent_id == category_id:
                return True

            parent = await self.get_by_id(current_parent_id)
            if parent is None:
                return False

            current_parent_id = parent.parent_id

        return False
