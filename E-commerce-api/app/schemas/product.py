from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from decimal import Decimal

# Product Image Schemas
class ProductImageBase(BaseModel):
    image_url: str
    is_primary: bool = False

class ProductImageCreate(ProductImageBase):
    pass

class ProductImageUpdate(BaseModel):
    image_url: Optional[str] = None
    is_primary: Optional[bool] = None

class ProductImageResponse(ProductImageBase):
    id: int
    product_id: UUID

    model_config = ConfigDict(from_attributes=True)

# Product Variant Schemas
class ProductVariantBase(BaseModel):
    sku: str
    price_modifier: Decimal = Decimal("0.0")
    stock_quantity: int = 0
    attributes: Optional[Dict[str, Any]] = None

class ProductVariantCreate(ProductVariantBase):
    pass

class ProductVariantUpdate(BaseModel):
    sku: Optional[str] = None
    price_modifier: Optional[Decimal] = None
    stock_quantity: Optional[int] = None
    attributes: Optional[Dict[str, Any]] = None

class ProductVariantResponse(ProductVariantBase):
    id: UUID
    product_id: UUID

    model_config = ConfigDict(from_attributes=True)


# Product Schemas
class ProductBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    base_price: Decimal
    is_active: bool = True
    category_id: int

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    base_price: Optional[Decimal] = None
    is_active: Optional[bool] = None
    category_id: Optional[int] = None

class ProductResponse(ProductBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    images: List[ProductImageResponse] = []
    variants: List[ProductVariantResponse] = []

    model_config = ConfigDict(from_attributes=True)
