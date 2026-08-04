from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.models import Product, ProductImage, ProductVariant
from app.schemas.product import (
    ProductCreate,
    ProductImageCreate,
    ProductImageUpdate,
    ProductUpdate,
    ProductVariantCreate,
    ProductVariantUpdate,
)


class ProductRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, product_id: UUID) -> Optional[Product]:
        result = await self.session.execute(
            select(Product)
            .where(Product.id == product_id)
            .options(selectinload(Product.images), selectinload(Product.variants))
        )
        return result.scalars().first()

    async def get_by_slug(self, slug: str) -> Optional[Product]:
        result = await self.session.execute(
            select(Product)
            .where(Product.slug == slug)
            .options(selectinload(Product.images), selectinload(Product.variants))
        )
        return result.scalars().first()

    async def list(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
        category_id: Optional[int] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> list[Product]:
        stmt = (
            select(Product)
            .options(selectinload(Product.images), selectinload(Product.variants))
            .order_by(Product.created_at.desc())
            .offset(skip)
            .limit(limit)
        )

        if category_id is not None:
            stmt = stmt.where(Product.category_id == category_id)

        if is_active is not None:
            stmt = stmt.where(Product.is_active == is_active)

        if search:
            stmt = stmt.where(Product.name.ilike(f"%{search}%"))

        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create(self, product_in: ProductCreate) -> Product:
        product = Product(**product_in.model_dump())
        self.session.add(product)
        await self.session.commit()
        return await self.get_by_id(product.id)

    async def update(self, product: Product, product_in: ProductUpdate) -> Product:
        update_data = product_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(product, field, value)

        self.session.add(product)
        await self.session.commit()
        return await self.get_by_id(product.id)

    async def delete(self, product: Product) -> None:
        await self.session.delete(product)
        await self.session.commit()


class ProductVariantRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, variant_id: UUID) -> Optional[ProductVariant]:
        result = await self.session.execute(
            select(ProductVariant).where(ProductVariant.id == variant_id)
        )
        return result.scalars().first()

    async def get_by_sku(self, sku: str) -> Optional[ProductVariant]:
        result = await self.session.execute(
            select(ProductVariant).where(ProductVariant.sku == sku)
        )
        return result.scalars().first()

    async def create(
        self, product_id: UUID, variant_in: ProductVariantCreate
    ) -> ProductVariant:
        variant = ProductVariant(product_id=product_id, **variant_in.model_dump())
        self.session.add(variant)
        await self.session.commit()
        await self.session.refresh(variant)
        return variant

    async def update(
        self, variant: ProductVariant, variant_in: ProductVariantUpdate
    ) -> ProductVariant:
        update_data = variant_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(variant, field, value)

        self.session.add(variant)
        await self.session.commit()
        await self.session.refresh(variant)
        return variant

    async def delete(self, variant: ProductVariant) -> None:
        await self.session.delete(variant)
        await self.session.commit()


class ProductImageRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, image_id: int) -> Optional[ProductImage]:
        result = await self.session.execute(
            select(ProductImage).where(ProductImage.id == image_id)
        )
        return result.scalars().first()

    async def create(self, product_id: UUID, image_in: ProductImageCreate) -> ProductImage:
        image = ProductImage(product_id=product_id, **image_in.model_dump())
        self.session.add(image)
        await self.session.commit()
        await self.session.refresh(image)
        return image

    async def update(
        self, image: ProductImage, image_in: ProductImageUpdate
    ) -> ProductImage:
        update_data = image_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(image, field, value)

        self.session.add(image)
        await self.session.commit()
        await self.session.refresh(image)
        return image

    async def delete(self, image: ProductImage) -> None:
        await self.session.delete(image)
        await self.session.commit()

    async def unset_primary_images(self, product_id: UUID) -> None:
        result = await self.session.execute(
            select(ProductImage).where(ProductImage.product_id == product_id)
        )
        for image in result.scalars().all():
            image.is_primary = False
            self.session.add(image)
