from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.models import ProductVariant


class InventoryResponse(BaseModel):
    variant_id: UUID
    product_id: UUID
    product_name: str | None = None
    sku: str
    stock_quantity: int
    low_stock_threshold: int
    is_low_stock: bool
    is_out_of_stock: bool

    @classmethod
    def from_variant(
        cls, variant: ProductVariant, low_stock_threshold: int
    ) -> "InventoryResponse":
        return cls(
            variant_id=variant.id,
            product_id=variant.product_id,
            product_name=variant.product.name if variant.product else None,
            sku=variant.sku,
            stock_quantity=variant.stock_quantity,
            low_stock_threshold=low_stock_threshold,
            is_low_stock=0 < variant.stock_quantity <= low_stock_threshold,
            is_out_of_stock=variant.stock_quantity == 0,
        )


class InventoryStockSet(BaseModel):
    stock_quantity: int = Field(ge=0)
    reason: str | None = Field(default=None, max_length=255)


class InventoryStockAdjustment(BaseModel):
    quantity: int = Field(gt=0)
    reason: str | None = Field(default=None, max_length=255)


class InventoryAdjustmentResponse(InventoryResponse):
    previous_stock_quantity: int
    adjustment_quantity: int
    reason: str | None = None
    adjusted_at: datetime
