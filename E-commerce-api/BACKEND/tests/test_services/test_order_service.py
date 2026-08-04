import pytest
import uuid
from decimal import Decimal
from app.services.order import (
    OrderService,
    AddressNotFoundError,
    AddressOwnershipError,
    OrderItemNotFoundError,
    OrderItemOwnershipError,
    ProductVariantNotFoundError,
    InsufficientStockError
)
from app.schemas.order import OrderCreate, OrderItemCreate, OrderItemUpdate
from app.models.models import (
    Address,
    AddressType,
    Category,
    Product,
    ProductVariant,
    RoleType,
    User,
)

@pytest.mark.asyncio
async def test_order_service_unit_edge_cases(db_session):
    u1 = User(id=uuid.uuid4(), email=f"u1_{uuid.uuid4()}@ex.com", password_hash="h", first_name="U", last_name="1", role=RoleType.customer)
    u2 = User(id=uuid.uuid4(), email=f"u2_{uuid.uuid4()}@ex.com", password_hash="h", first_name="U", last_name="2", role=RoleType.customer)
    db_session.add_all([u1, u2])
    await db_session.commit()

    addr1 = Address(id=uuid.uuid4(), user_id=u1.id, address_type=AddressType.shipping, street_address="S1", city="C1", state="S", postal_code="1", country="C", phone_number="1")
    db_session.add(addr1)
    await db_session.commit()

    order_svc = OrderService(db_session)

    # 1. Address not found error
    with pytest.raises(AddressNotFoundError):
        await order_svc.create_order(u1.id, OrderCreate(
            shipping_address_id=uuid.uuid4(), billing_address_id=addr1.id
        ))

    # 2. Address ownership error (u2 trying to use u1's address)
    with pytest.raises(AddressOwnershipError):
        await order_svc.create_order(u2.id, OrderCreate(
            shipping_address_id=addr1.id, billing_address_id=addr1.id
        ))

    # 3. Create valid order for u1
    order = await order_svc.create_order(u1.id, OrderCreate(
        shipping_address_id=addr1.id, billing_address_id=addr1.id
    ))

    # Draft line-item prices and totals are always calculated server-side.
    category = Category(name="Order test", slug=f"order-test-{uuid.uuid4()}")
    db_session.add(category)
    await db_session.flush()
    product = Product(
        category_id=category.id,
        name="Order product",
        slug=f"order-product-{uuid.uuid4()}",
        base_price=Decimal("10.00"),
    )
    db_session.add(product)
    await db_session.flush()
    variant = ProductVariant(
        product_id=product.id,
        sku=f"ORDER-{uuid.uuid4()}",
        price_modifier=Decimal("2.50"),
        stock_quantity=10,
    )
    db_session.add(variant)
    await db_session.commit()

    item = await order_svc.add_item(
        u1.id, order.id, OrderItemCreate(variant_id=variant.id, quantity=2)
    )
    assert item.price_per_item == Decimal("12.50")
    assert (await order_svc.get_order(order.id)).total_amount == Decimal("25.00")

    await order_svc.update_item(u1.id, order.id, item.id, OrderItemUpdate(quantity=3))
    assert (await order_svc.get_order(order.id)).total_amount == Decimal("37.50")

    await order_svc.delete_item(u1.id, order.id, item.id)
    assert (await order_svc.get_order(order.id)).total_amount == Decimal("0.00")

    # 4. Add item with non-existent variant ID -> ProductVariantNotFoundError
    with pytest.raises(ProductVariantNotFoundError):
        await order_svc.add_item(u1.id, order.id, OrderItemCreate(
            variant_id=uuid.uuid4(), quantity=1
        ))

    # 5. Order item not found
    with pytest.raises(OrderItemNotFoundError):
        await order_svc.delete_item(u1.id, order.id, 999999)
