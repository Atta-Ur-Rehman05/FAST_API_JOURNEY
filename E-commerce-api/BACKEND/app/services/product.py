from typing import Optional
from uuid import UUID

from sqlalchemy.exc import IntegrityError
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

    async def count_products(self, **filters) -> int:
        return await self.product_repo.count(**filters)

    async def create_product(self, product_in: ProductCreate) -> Product:
        existing_product = await self.product_repo.get_by_slug(product_in.slug)
        if existing_product:
            raise DuplicateProductSlugError("A product with this slug already exists.")

        await self._validate_category(product_in.category_id)
        await self._validate_new_variants(product_in.variants)
        if sum(image.is_primary for image in product_in.images) > 1:
            raise ProductServiceError("Only one product image can be primary.")

        try:
            product = await self.product_repo.create(product_in)
            for variant_in in product_in.variants:
                await self.variant_repo.create(product.id, variant_in)
            for image_in in product_in.images:
                await self.image_repo.create(product.id, image_in)
            await self.session.commit()
        except IntegrityError as exc:
            await self.session.rollback()
            err_msg = str(exc).lower()
            if "slug" in err_msg:
                raise DuplicateProductSlugError("A product with this slug already exists.") from exc
            if "sku" in err_msg:
                raise DuplicateProductVariantSkuError("A product variant with this SKU already exists.") from exc
            if "is_primary" in err_msg or "one_primary_per_product" in err_msg:
                raise ProductServiceError("Only one product image can be primary.") from exc
            raise ProductServiceError("Data integrity error during product creation.") from exc
        except Exception:
            await self.session.rollback()
            raise
        return await self.get_product(product.id)

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

        try:
            await self.product_repo.update(product, product_in)
            await self.session.commit()
        except IntegrityError as exc:
            await self.session.rollback()
            err_msg = str(exc).lower()
            if "slug" in err_msg:
                raise DuplicateProductSlugError("A product with this slug already exists.") from exc
            raise ProductServiceError("Data integrity error during product update.") from exc
        except Exception:
            await self.session.rollback()
            raise
        return await self.get_product(product.id)

    async def delete_product(self, product_id: UUID) -> None:
        product = await self.get_product(product_id)
        try:
            await self.product_repo.delete(product)
            await self.session.commit()
        except IntegrityError as exc:
            await self.session.rollback()
            raise ProductServiceError("Cannot delete product with existing order history; deactivate it instead.") from exc
        except Exception:
            await self.session.rollback()
            raise

    async def create_variant(
        self, product_id: UUID, variant_in: ProductVariantCreate
    ) -> ProductVariant:
        await self.get_product(product_id)
        existing_variant = await self.variant_repo.get_by_sku(variant_in.sku)
        if existing_variant:
            raise DuplicateProductVariantSkuError(
                "A product variant with this SKU already exists."
            )

        try:
            variant = await self.variant_repo.create(product_id, variant_in)
            await self.session.commit()
        except IntegrityError as exc:
            await self.session.rollback()
            err_msg = str(exc).lower()
            if "sku" in err_msg:
                raise DuplicateProductVariantSkuError("A product variant with this SKU already exists.") from exc
            raise ProductServiceError("Data integrity error during variant creation.") from exc
        except Exception:
            await self.session.rollback()
            raise
        return variant

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

        try:
            await self.variant_repo.update(variant, variant_in)
            await self.session.commit()
        except IntegrityError as exc:
            await self.session.rollback()
            err_msg = str(exc).lower()
            if "sku" in err_msg:
                raise DuplicateProductVariantSkuError("A product variant with this SKU already exists.") from exc
            raise ProductServiceError("Data integrity error during variant update.") from exc
        except Exception:
            await self.session.rollback()
            raise
        return variant

    async def delete_variant(self, product_id: UUID, variant_id: UUID) -> None:
        variant = await self._get_product_variant(product_id, variant_id)
        try:
            await self.variant_repo.delete(variant)
            await self.session.commit()
        except Exception:
            await self.session.rollback()
            raise

    async def create_image(
        self, product_id: UUID, image_in: ProductImageCreate
    ) -> ProductImage:
        await self.get_product(product_id)
        if image_in.is_primary:
            await self.image_repo.unset_primary_images(product_id)

        try:
            image = await self.image_repo.create(product_id, image_in)
            await self.session.commit()
        except IntegrityError as exc:
            await self.session.rollback()
            err_msg = str(exc).lower()
            if "is_primary" in err_msg or "one_primary_per_product" in err_msg:
                raise ProductServiceError("Only one product image can be primary.") from exc
            raise ProductServiceError("Data integrity error during image creation.") from exc
        except Exception:
            await self.session.rollback()
            raise
        return image

    async def update_image(
        self,
        product_id: UUID,
        image_id: int,
        image_in: ProductImageUpdate,
    ) -> ProductImage:
        image = await self._get_product_image(product_id, image_id)
        if image_in.is_primary:
            await self.image_repo.unset_primary_images(product_id)

        try:
            await self.image_repo.update(image, image_in)
            await self.session.commit()
        except IntegrityError as exc:
            await self.session.rollback()
            err_msg = str(exc).lower()
            if "is_primary" in err_msg or "one_primary_per_product" in err_msg:
                raise ProductServiceError("Only one product image can be primary.") from exc
            raise ProductServiceError("Data integrity error during image update.") from exc
        except Exception:
            await self.session.rollback()
            raise
        return image

    async def delete_image(self, product_id: UUID, image_id: int) -> None:
        image = await self._get_product_image(product_id, image_id)
        try:
            await self.image_repo.delete(image)
            await self.session.commit()
        except Exception:
            await self.session.rollback()
            raise

    async def _validate_category(self, category_id: int) -> None:
        category = await self.category_repo.get_by_id(category_id)
        if category is None:
            raise ProductCategoryNotFoundError("Category not found.")

    async def _validate_new_variants(
        self, variants: list[ProductVariantCreate]
    ) -> None:
        if not variants:
            return

        seen_skus: set[str] = set()
        skus_to_check: list[str] = []
        for variant in variants:
            if variant.sku in seen_skus:
                raise DuplicateProductVariantSkuError(
                    "A product variant with this SKU already exists."
                )
            seen_skus.add(variant.sku)
            skus_to_check.append(variant.sku)

        existing_variants = await self.variant_repo.get_by_skus(skus_to_check)
        if existing_variants:
            raise DuplicateProductVariantSkuError(
                "A product variant with this SKU already exists."
            )

    async def _get_product_variant(
        self, product_id: UUID, variant_id: UUID
    ) -> ProductVariant:
        variant = await self.variant_repo.get_by_id_and_product(variant_id, product_id)
        if variant is None:
            if await self.variant_repo.get_by_id(variant_id):
                raise ProductOwnershipError("Product variant does not belong to product.")
            raise ProductVariantNotFoundError("Product variant not found.")
        return variant

    async def _get_product_image(self, product_id: UUID, image_id: int) -> ProductImage:
        image = await self.image_repo.get_by_id_and_product(image_id, product_id)
        if image is None:
            if await self.image_repo.get_by_id(image_id):
                raise ProductOwnershipError("Product image does not belong to product.")
            raise ProductImageNotFoundError("Product image not found.")
        return image
