from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Product, ProductImage, ProductVariant
from app.repositories.category import CategoryRepository
from app.repositories.product import (
    ProductImageRepository,
    ProductRepository,
    ProductVariantRepository,
)
from app.schemas.product import (
    ProductCreate,
    ProductImageCreate,
    ProductImageUpdate,
    ProductUpdate,
    ProductVariantCreate,
    ProductVariantUpdate,
)


class ProductServiceError(Exception):
    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)


class ProductNotFoundError(ProductServiceError):
    pass


class ProductCategoryNotFoundError(ProductServiceError):
    pass


class DuplicateProductSlugError(ProductServiceError):
    pass


class ProductVariantNotFoundError(ProductServiceError):
    pass


class DuplicateProductVariantSkuError(ProductServiceError):
    pass


class ProductImageNotFoundError(ProductServiceError):
    pass


class ProductOwnershipError(ProductServiceError):
    pass


class ProductService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.category_repo = CategoryRepository(session)
        self.product_repo = ProductRepository(session)
        self.variant_repo = ProductVariantRepository(session)
        self.image_repo = ProductImageRepository(session)

    async def list_products(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
        category_id: Optional[int] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> list[Product]:
        return await self.product_repo.list(
            skip=skip,
            limit=limit,
            category_id=category_id,
            is_active=is_active,
            search=search,
        )

    async def create_product(self, product_in: ProductCreate) -> Product:
        existing_product = await self.product_repo.get_by_slug(product_in.slug)
        if existing_product:
            raise DuplicateProductSlugError("A product with this slug already exists.")

        await self._validate_category(product_in.category_id)
        return await self.product_repo.create(product_in)

    async def get_product(self, product_id: UUID) -> Product:
        product = await self.product_repo.get_by_id(product_id)
        if product is None:
            raise ProductNotFoundError("Product not found.")
        return product

    async def update_product(
        self, product_id: UUID, product_in: ProductUpdate
    ) -> Product:
        product = await self.get_product(product_id)

        if product_in.slug is not None:
            existing_product = await self.product_repo.get_by_slug(product_in.slug)
            if existing_product and existing_product.id != product_id:
                raise DuplicateProductSlugError(
                    "A product with this slug already exists."
                )

        if product_in.category_id is not None:
            await self._validate_category(product_in.category_id)

        return await self.product_repo.update(product, product_in)

    async def delete_product(self, product_id: UUID) -> None:
        product = await self.get_product(product_id)
        await self.product_repo.delete(product)

    async def create_variant(
        self, product_id: UUID, variant_in: ProductVariantCreate
    ) -> ProductVariant:
        await self.get_product(product_id)
        existing_variant = await self.variant_repo.get_by_sku(variant_in.sku)
        if existing_variant:
            raise DuplicateProductVariantSkuError(
                "A product variant with this SKU already exists."
            )

        return await self.variant_repo.create(product_id, variant_in)

    async def update_variant(
        self,
        product_id: UUID,
        variant_id: UUID,
        variant_in: ProductVariantUpdate,
    ) -> ProductVariant:
        variant = await self._get_product_variant(product_id, variant_id)

        if variant_in.sku is not None:
            existing_variant = await self.variant_repo.get_by_sku(variant_in.sku)
            if existing_variant and existing_variant.id != variant_id:
                raise DuplicateProductVariantSkuError(
                    "A product variant with this SKU already exists."
                )

        return await self.variant_repo.update(variant, variant_in)

    async def delete_variant(self, product_id: UUID, variant_id: UUID) -> None:
        variant = await self._get_product_variant(product_id, variant_id)
        await self.variant_repo.delete(variant)

    async def create_image(
        self, product_id: UUID, image_in: ProductImageCreate
    ) -> ProductImage:
        await self.get_product(product_id)
        if image_in.is_primary:
            await self.image_repo.unset_primary_images(product_id)

        return await self.image_repo.create(product_id, image_in)

    async def update_image(
        self,
        product_id: UUID,
        image_id: int,
        image_in: ProductImageUpdate,
    ) -> ProductImage:
        image = await self._get_product_image(product_id, image_id)
        if image_in.is_primary:
            await self.image_repo.unset_primary_images(product_id)

        return await self.image_repo.update(image, image_in)

    async def delete_image(self, product_id: UUID, image_id: int) -> None:
        image = await self._get_product_image(product_id, image_id)
        await self.image_repo.delete(image)

    async def _validate_category(self, category_id: int) -> None:
        category = await self.category_repo.get_by_id(category_id)
        if category is None:
            raise ProductCategoryNotFoundError("Category not found.")

    async def _get_product_variant(
        self, product_id: UUID, variant_id: UUID
    ) -> ProductVariant:
        await self.get_product(product_id)
        variant = await self.variant_repo.get_by_id(variant_id)
        if variant is None:
            raise ProductVariantNotFoundError("Product variant not found.")

        if variant.product_id != product_id:
            raise ProductOwnershipError("Product variant does not belong to product.")

        return variant

    async def _get_product_image(self, product_id: UUID, image_id: int) -> ProductImage:
        await self.get_product(product_id)
        image = await self.image_repo.get_by_id(image_id)
        if image is None:
            raise ProductImageNotFoundError("Product image not found.")

        if image.product_id != product_id:
            raise ProductOwnershipError("Product image does not belong to product.")

        return image
