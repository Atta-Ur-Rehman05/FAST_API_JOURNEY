from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.models import Product, ProductVariant


class InventoryRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        product_id: Optional[UUID] = None,
        low_stock_threshold: Optional[int] = None,
        low_stock_only: bool = False,
        out_of_stock_only: bool = False,
    ) -> list[ProductVariant]:
        stmt = (
            select(ProductVariant)
            .options(selectinload(ProductVariant.product))
            .order_by(ProductVariant.sku.asc())
            .offset(skip)
            .limit(limit)
        )

        if product_id is not None:
            stmt = stmt.where(ProductVariant.product_id == product_id)

        if search:
            stmt = stmt.join(Product).where(
                ProductVariant.sku.ilike(f"%{search}%")
                | Product.name.ilike(f"%{search}%")
            )

        if out_of_stock_only:
            stmt = stmt.where(ProductVariant.stock_quantity == 0)
        elif low_stock_only and low_stock_threshold is not None:
            stmt = stmt.where(
                ProductVariant.stock_quantity > 0,
                ProductVariant.stock_quantity <= low_stock_threshold,
            )

        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id(self, variant_id: UUID) -> Optional[ProductVariant]:
        result = await self.session.execute(
            select(ProductVariant)
            .where(ProductVariant.id == variant_id)
            .options(selectinload(ProductVariant.product))
        )
        return result.scalars().first()

    async def get_by_sku(self, sku: str) -> Optional[ProductVariant]:
        result = await self.session.execute(
            select(ProductVariant)
            .where(ProductVariant.sku == sku)
            .options(selectinload(ProductVariant.product))
        )
        return result.scalars().first()

    async def save(self, variant: ProductVariant) -> ProductVariant:
        self.session.add(variant)
        await self.session.commit()
        await self.session.refresh(variant)
        return await self.get_by_id(variant.id)
