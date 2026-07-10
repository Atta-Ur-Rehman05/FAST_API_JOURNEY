from datetime import datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import ProductVariant
from app.repositories.inventory import InventoryRepository
from app.schemas.inventory import InventoryAdjustmentResponse, InventoryResponse


class InventoryServiceError(Exception):
    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)


class InventoryVariantNotFoundError(InventoryServiceError):
    pass


class InsufficientInventoryError(InventoryServiceError):
    pass


class InventoryService:
    def __init__(self, session: AsyncSession):
        self.inventory_repo = InventoryRepository(session)

    async def list_inventory(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
        search: str | None = None,
        product_id: UUID | None = None,
        low_stock_threshold: int = 5,
        low_stock_only: bool = False,
        out_of_stock_only: bool = False,
    ) -> list[InventoryResponse]:
        variants = await self.inventory_repo.list(
            skip=skip,
            limit=limit,
            search=search,
            product_id=product_id,
            low_stock_threshold=low_stock_threshold,
            low_stock_only=low_stock_only,
            out_of_stock_only=out_of_stock_only,
        )
        return [
            InventoryResponse.from_variant(variant, low_stock_threshold)
            for variant in variants
        ]

    async def get_inventory(
        self, variant_id: UUID, low_stock_threshold: int = 5
    ) -> InventoryResponse:
        variant = await self._get_variant(variant_id)
        return InventoryResponse.from_variant(variant, low_stock_threshold)

    async def get_inventory_by_sku(
        self, sku: str, low_stock_threshold: int = 5
    ) -> InventoryResponse:
        variant = await self.inventory_repo.get_by_sku(sku)
        if variant is None:
            raise InventoryVariantNotFoundError("Product variant not found.")

        return InventoryResponse.from_variant(variant, low_stock_threshold)

    async def set_stock(
        self,
        variant_id: UUID,
        stock_quantity: int,
        *,
        reason: str | None = None,
        low_stock_threshold: int = 5,
    ) -> InventoryAdjustmentResponse:
        variant = await self._get_variant(variant_id)
        previous_stock = variant.stock_quantity
        variant.stock_quantity = stock_quantity
        saved_variant = await self.inventory_repo.save(variant)
        return self._build_adjustment_response(
            saved_variant,
            previous_stock,
            stock_quantity - previous_stock,
            reason,
            low_stock_threshold,
        )

    async def restock(
        self,
        variant_id: UUID,
        quantity: int,
        *,
        reason: str | None = None,
        low_stock_threshold: int = 5,
    ) -> InventoryAdjustmentResponse:
        return await self._adjust_stock(
            variant_id,
            quantity,
            reason=reason,
            low_stock_threshold=low_stock_threshold,
        )

    async def deduct(
        self,
        variant_id: UUID,
        quantity: int,
        *,
        reason: str | None = None,
        low_stock_threshold: int = 5,
    ) -> InventoryAdjustmentResponse:
        return await self._adjust_stock(
            variant_id,
            -quantity,
            reason=reason,
            low_stock_threshold=low_stock_threshold,
        )

    async def release(
        self,
        variant_id: UUID,
        quantity: int,
        *,
        reason: str | None = None,
        low_stock_threshold: int = 5,
    ) -> InventoryAdjustmentResponse:
        return await self.restock(
            variant_id,
            quantity,
            reason=reason,
            low_stock_threshold=low_stock_threshold,
        )

    async def _adjust_stock(
        self,
        variant_id: UUID,
        adjustment_quantity: int,
        *,
        reason: str | None,
        low_stock_threshold: int,
    ) -> InventoryAdjustmentResponse:
        variant = await self._get_variant(variant_id)
        previous_stock = variant.stock_quantity
        new_stock = previous_stock + adjustment_quantity
        if new_stock < 0:
            raise InsufficientInventoryError("Requested quantity exceeds available stock.")

        variant.stock_quantity = new_stock
        saved_variant = await self.inventory_repo.save(variant)
        return self._build_adjustment_response(
            saved_variant,
            previous_stock,
            adjustment_quantity,
            reason,
            low_stock_threshold,
        )

    async def _get_variant(self, variant_id: UUID) -> ProductVariant:
        variant = await self.inventory_repo.get_by_id(variant_id)
        if variant is None:
            raise InventoryVariantNotFoundError("Product variant not found.")
        return variant

    def _build_adjustment_response(
        self,
        variant: ProductVariant,
        previous_stock: int,
        adjustment_quantity: int,
        reason: str | None,
        low_stock_threshold: int,
    ) -> InventoryAdjustmentResponse:
        inventory = InventoryResponse.from_variant(variant, low_stock_threshold)
        return InventoryAdjustmentResponse(
            **inventory.model_dump(),
            previous_stock_quantity=previous_stock,
            adjustment_quantity=adjustment_quantity,
            reason=reason,
            adjusted_at=datetime.utcnow(),
        )
