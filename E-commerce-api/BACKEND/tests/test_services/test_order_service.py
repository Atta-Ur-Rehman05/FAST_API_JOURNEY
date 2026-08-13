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
    InsufficientStockError,
    InvalidOrderTransitionError,
    OrderDeletionNotAllowedError,
    OrderNotEditableError,
    OrderNotFoundError,
    OrderOwnershipError,
)
from app.schemas.order import OrderCreate, OrderItemCreate, OrderItemUpdate, OrderUpdate
from app.models.models import (
    Address,
    AddressType,
    Category,
    OrderStatus,
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

    with pytest.raises(AddressNotFoundError):
        await order_svc.create_order(u1.id, OrderCreate(
            shipping_address_id=uuid.uuid4(), billing_address_id=addr1.id
        ))

    with pytest.raises(AddressOwnershipError):
        await order_svc.create_order(u2.id, OrderCreate(
            shipping_address_id=addr1.id, billing_address_id=addr1.id
        ))

    order = await order_svc.create_order(u1.id, OrderCreate(
        shipping_address_id=addr1.id, billing_address_id=addr1.id
    ))

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

    with pytest.raises(ProductVariantNotFoundError):
        await order_svc.add_item(u1.id, order.id, OrderItemCreate(
            variant_id=uuid.uuid4(), quantity=1
        ))

    with pytest.raises(OrderItemNotFoundError):
        await order_svc.delete_item(u1.id, order.id, 999999)


@pytest.mark.asyncio
async def test_order_state_machine_blocks_invalid_transitions(db_session):
    u1 = User(id=uuid.uuid4(), email=f"u1_{uuid.uuid4()}@ex.com", password_hash="h", first_name="U", last_name="1", role=RoleType.customer)
    db_session.add(u1)
    await db_session.commit()

    addr1 = Address(id=uuid.uuid4(), user_id=u1.id, address_type=AddressType.shipping, street_address="S1", city="C1", state="S", postal_code="1", country="C", phone_number="1")
    db_session.add(addr1)
    await db_session.commit()

    order_svc = OrderService(db_session)
    order = await order_svc.create_order(u1.id, OrderCreate(
        shipping_address_id=addr1.id, billing_address_id=addr1.id
    ))

    with pytest.raises(InvalidOrderTransitionError):
        await order_svc.transition_status(order.id, OrderStatus.delivered)

    await order_svc.transition_status(order.id, OrderStatus.pending)
    with pytest.raises(InvalidOrderTransitionError):
        await order_svc.transition_status(order.id, OrderStatus.delivered)

    await order_svc.transition_status(order.id, OrderStatus.processing)
    with pytest.raises(InvalidOrderTransitionError):
        await order_svc.transition_status(order.id, OrderStatus.pending)

    await order_svc.transition_status(order.id, OrderStatus.shipped)
    await order_svc.transition_status(order.id, OrderStatus.delivered)

    with pytest.raises(InvalidOrderTransitionError):
        await order_svc.transition_status(order.id, OrderStatus.cancelled)

    with pytest.raises(OrderDeletionNotAllowedError):
        await order_svc.delete_order(order.id)


@pytest.mark.asyncio
async def test_order_cancellation_releases_reservations(db_session):
    u1 = User(id=uuid.uuid4(), email=f"u1_{uuid.uuid4()}@ex.com", password_hash="h", first_name="U", last_name="1", role=RoleType.customer)
    db_session.add(u1)
    await db_session.commit()

    addr1 = Address(id=uuid.uuid4(), user_id=u1.id, address_type=AddressType.shipping, street_address="S1", city="C1", state="S", postal_code="1", country="C", phone_number="1")
    db_session.add(addr1)
    await db_session.commit()

    category = Category(name="Cancel test", slug=f"cancel-test-{uuid.uuid4()}")
    db_session.add(category)
    await db_session.flush()
    product = Product(
        category_id=category.id,
        name="Cancel product",
        slug=f"cancel-product-{uuid.uuid4()}",
        base_price=Decimal("10.00"),
    )
    db_session.add(product)
    await db_session.flush()
    variant = ProductVariant(
        product_id=product.id,
        sku=f"CAN-{uuid.uuid4()}",
        price_modifier=Decimal("0"),
        stock_quantity=10,
        reserved_quantity=5,
    )
    db_session.add(variant)
    await db_session.commit()

    order_svc = OrderService(db_session)
    order = await order_svc.create_order(u1.id, OrderCreate(
        shipping_address_id=addr1.id, billing_address_id=addr1.id
    ))

    item = await order_svc.add_item(u1.id, order.id, OrderItemCreate(variant_id=variant.id, quantity=3))
    order_check = await order_svc.get_order(order.id)
    assert len(order_check.items) == 1
    assert order_check.total_amount == Decimal("30.00")
    await order_svc.transition_status(order.id, OrderStatus.pending)

    order_after_pending = await order_svc.get_order(order.id)
    assert order_after_pending.order_status == OrderStatus.pending
    assert len(order_after_pending.items) == 1

    await order_svc.transition_status(order.id, OrderStatus.cancelled)

    await db_session.refresh(variant)
    assert variant.reserved_quantity == 2


@pytest.mark.asyncio
async def test_order_failed_status_releases_reservations(db_session):
    u1 = User(id=uuid.uuid4(), email=f"u1_{uuid.uuid4()}@ex.com", password_hash="h", first_name="U", last_name="1", role=RoleType.customer)
    db_session.add(u1)
    await db_session.commit()

    addr1 = Address(id=uuid.uuid4(), user_id=u1.id, address_type=AddressType.shipping, street_address="S1", city="C1", state="S", postal_code="1", country="C", phone_number="1")
    db_session.add(addr1)
    await db_session.commit()

    category = Category(name="Fail test", slug=f"fail-test-{uuid.uuid4()}")
    db_session.add(category)
    await db_session.flush()
    product = Product(
        category_id=category.id,
        name="Fail product",
        slug=f"fail-product-{uuid.uuid4()}",
        base_price=Decimal("10.00"),
    )
    db_session.add(product)
    await db_session.flush()
    variant = ProductVariant(
        product_id=product.id,
        sku=f"FAIL-{uuid.uuid4()}",
        price_modifier=Decimal("0"),
        stock_quantity=10,
        reserved_quantity=4,
    )
    db_session.add(variant)
    await db_session.commit()

    order_svc = OrderService(db_session)
    order = await order_svc.create_order(u1.id, OrderCreate(
        shipping_address_id=addr1.id, billing_address_id=addr1.id
    ))

    await order_svc.add_item(u1.id, order.id, OrderItemCreate(variant_id=variant.id, quantity=2))
    await order_svc.transition_status(order.id, OrderStatus.pending)

    await order_svc.transition_status(order.id, OrderStatus.failed)

    await db_session.refresh(variant)
    assert variant.reserved_quantity == 2


@pytest.mark.asyncio
async def test_customer_cancellation_request(db_session):
    u1 = User(id=uuid.uuid4(), email=f"u1_{uuid.uuid4()}@ex.com", password_hash="h", first_name="U", last_name="1", role=RoleType.customer)
    db_session.add(u1)
    await db_session.commit()

    addr1 = Address(id=uuid.uuid4(), user_id=u1.id, address_type=AddressType.shipping, street_address="S1", city="C1", state="S", postal_code="1", country="C", phone_number="1")
    db_session.add(addr1)
    await db_session.commit()

    order_svc = OrderService(db_session)
    order = await order_svc.create_order(u1.id, OrderCreate(
        shipping_address_id=addr1.id, billing_address_id=addr1.id
    ))

    await order_svc.transition_status(order.id, OrderStatus.pending)
    cancelled = await order_svc.request_cancellation(u1.id, order.id)
    assert cancelled.order_status == OrderStatus.cancelled

    with pytest.raises(InvalidOrderTransitionError):
        await order_svc.request_cancellation(u1.id, order.id)


@pytest.mark.asyncio
async def test_admin_update_order_blocks_completed(db_session):
    u1 = User(id=uuid.uuid4(), email=f"u1_{uuid.uuid4()}@ex.com", password_hash="h", first_name="U", last_name="1", role=RoleType.customer)
    db_session.add(u1)
    await db_session.commit()

    addr1 = Address(id=uuid.uuid4(), user_id=u1.id, address_type=AddressType.shipping, street_address="S1", city="C1", state="S", postal_code="1", country="C", phone_number="1")
    db_session.add(addr1)
    await db_session.commit()

    order_svc = OrderService(db_session)
    order = await order_svc.create_order(u1.id, OrderCreate(
        shipping_address_id=addr1.id, billing_address_id=addr1.id
    ))

    await order_svc.transition_status(order.id, OrderStatus.pending)
    await order_svc.transition_status(order.id, OrderStatus.processing)
    await order_svc.transition_status(order.id, OrderStatus.shipped)
    await order_svc.transition_status(order.id, OrderStatus.delivered)

    with pytest.raises(OrderNotEditableError):
        await order_svc.update_order(order.id, OrderUpdate(shipping_address_id=addr1.id))

    with pytest.raises(OrderDeletionNotAllowedError):
        await order_svc.delete_order(order.id)


@pytest.mark.asyncio
async def test_order_ownership_enforced(db_session):
    u1 = User(id=uuid.uuid4(), email=f"u1_{uuid.uuid4()}@ex.com", password_hash="h", first_name="U", last_name="1", role=RoleType.customer)
    u2 = User(id=uuid.uuid4(), email=f"u2_{uuid.uuid4()}@ex.com", password_hash="h", first_name="U", last_name="2", role=RoleType.customer)
    db_session.add_all([u1, u2])
    await db_session.commit()

    addr1 = Address(id=uuid.uuid4(), user_id=u1.id, address_type=AddressType.shipping, street_address="S1", city="C1", state="S", postal_code="1", country="C", phone_number="1")
    db_session.add(addr1)
    await db_session.commit()

    order_svc = OrderService(db_session)
    order = await order_svc.create_order(u1.id, OrderCreate(
        shipping_address_id=addr1.id, billing_address_id=addr1.id
    ))

    with pytest.raises(OrderOwnershipError):
        await order_svc.get_user_order(u2.id, order.id)

    with pytest.raises(OrderOwnershipError):
        await order_svc.add_item(u2.id, order.id, OrderItemCreate(variant_id=uuid.uuid4(), quantity=1))
