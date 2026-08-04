import pytest
import uuid
from app.services.product import (
    ProductService,
    DuplicateProductSlugError,
    DuplicateProductVariantSkuError,
    ProductOwnershipError,
    ProductVariantNotFoundError,
    ProductImageNotFoundError
)
from app.schemas.product import ProductCreate, ProductUpdate, ProductVariantCreate, ProductVariantUpdate, ProductImageCreate
from app.services.category import CategoryService
from app.schemas.category import CategoryCreate

@pytest.mark.asyncio
async def test_product_service_edge_cases(db_session):
    cat_service = CategoryService(db_session)
    cat = await cat_service.create_category(CategoryCreate(name="ServiceCat", slug=f"svc-cat-{uuid.uuid4()}"))

    prod_service = ProductService(db_session)

    # 1. Create two products
    p1 = await prod_service.create_product(ProductCreate(
        category_id=cat.id, name="P1", slug=f"p1-slug-{uuid.uuid4()}", base_price=10
    ))
    p2 = await prod_service.create_product(ProductCreate(
        category_id=cat.id, name="P2", slug=f"p2-slug-{uuid.uuid4()}", base_price=20
    ))

    # 2. Update p2 with p1's slug -> DuplicateProductSlugError
    with pytest.raises(DuplicateProductSlugError):
        await prod_service.update_product(p2.id, ProductUpdate(slug=p1.slug))

    # 3. Create variants v1 on p1 and v2 on p2
    v1 = await prod_service.create_variant(p1.id, ProductVariantCreate(sku=f"SKU1-{uuid.uuid4()}", price_modifier=0, stock_quantity=10))
    v2 = await prod_service.create_variant(p2.id, ProductVariantCreate(sku=f"SKU2-{uuid.uuid4()}", price_modifier=0, stock_quantity=10))

    # 4. Duplicate SKU creation
    with pytest.raises(DuplicateProductVariantSkuError):
        await prod_service.create_variant(p1.id, ProductVariantCreate(sku=v1.sku, price_modifier=0, stock_quantity=5))

    # 5. Duplicate SKU update
    with pytest.raises(DuplicateProductVariantSkuError):
        await prod_service.update_variant(p2.id, v2.id, ProductVariantUpdate(sku=v1.sku))

    # 6. Variant ownership mismatch (trying to access v1 under p2's ID)
    with pytest.raises(ProductOwnershipError):
        await prod_service.update_variant(p2.id, v1.id, ProductVariantUpdate(stock_quantity=100))

    # 7. Non-existent variant
    with pytest.raises(ProductVariantNotFoundError):
        await prod_service.update_variant(p1.id, uuid.uuid4(), ProductVariantUpdate(stock_quantity=100))

    # 8. Image ownership mismatch & non-existent image
    img1 = await prod_service.create_image(p1.id, ProductImageCreate(image_url="http://img1.com", is_primary=True))
    with pytest.raises(ProductOwnershipError):
        await prod_service.delete_image(p2.id, img1.id)

    with pytest.raises(ProductImageNotFoundError):
        await prod_service.delete_image(p1.id, 999999)
