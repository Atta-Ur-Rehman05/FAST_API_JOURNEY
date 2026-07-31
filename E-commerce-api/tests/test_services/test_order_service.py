import pytest
import uuid
from app.services.order import (
    OrderService,
    AddressNotFoundError,
    AddressOwnershipError,
    OrderItemNotFoundError,
    OrderItemOwnershipError,
    ProductVariantNotFoundError,
    InsufficientStockError
)
from app.schemas.order import OrderCreate, OrderItemCreate
from app.models.models import Address, AddressType, User, RoleType

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
            shipping_address_id=uuid.uuid4(), billing_address_id=addr1.id, total_amount=100
        ))

    # 2. Address ownership error (u2 trying to use u1's address)
    with pytest.raises(AddressOwnershipError):
        await order_svc.create_order(u2.id, OrderCreate(
            shipping_address_id=addr1.id, billing_address_id=addr1.id, total_amount=100
        ))

    # 3. Create valid order for u1
    order = await order_svc.create_order(u1.id, OrderCreate(
        shipping_address_id=addr1.id, billing_address_id=addr1.id, total_amount=100
    ))

    # 4. Add item with non-existent variant ID -> ProductVariantNotFoundError
    with pytest.raises(ProductVariantNotFoundError):
        await order_svc.add_item(u1.id, order.id, OrderItemCreate(
            variant_id=uuid.uuid4(), quantity=1, price_per_item=10
        ))

    # 5. Order item not found
    with pytest.raises(OrderItemNotFoundError):
        await order_svc.delete_item(u1.id, order.id, 999999)
