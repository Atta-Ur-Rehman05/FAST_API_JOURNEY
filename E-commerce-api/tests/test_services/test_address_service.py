import pytest
import uuid
from app.services.address import (
    AddressService,
    AddressNotFoundError,
    AddressOwnershipError,
)
from app.schemas.address import AddressCreate, AddressUpdate
from app.models.models import Address, AddressType, User, RoleType


@pytest.mark.asyncio
async def test_address_service_crud_and_ownership(db_session):
    u1 = User(
        id=uuid.uuid4(),
        email=f"user1_{uuid.uuid4()}@example.com",
        password_hash="hash",
        first_name="User",
        last_name="One",
        role=RoleType.customer,
    )
    u2 = User(
        id=uuid.uuid4(),
        email=f"user2_{uuid.uuid4()}@example.com",
        password_hash="hash",
        first_name="User",
        last_name="Two",
        role=RoleType.customer,
    )
    db_session.add_all([u1, u2])
    await db_session.commit()

    service = AddressService(db_session)

    # 1. Create Address for u1
    addr_in = AddressCreate(
        full_name="John Doe",
        phone="+1234567890",
        address_line_1="123 Main St",
        address_line_2="Apt 4B",
        city="New York",
        state="NY",
        postal_code="10001",
        country="USA",
        address_type=AddressType.Home,
        is_default_shipping=True,
        is_default_billing=True,
    )

    addr1 = await service.create_address(u1.id, addr_in)
    assert addr1.id is not None
    assert addr1.user_id == u1.id
    assert addr1.full_name == "John Doe"
    assert addr1.is_default_shipping is True
    assert addr1.is_default_billing is True

    # 2. Get User Addresses for u1
    u1_addresses = await service.get_user_addresses(u1.id)
    assert len(u1_addresses) == 1
    assert u1_addresses[0].id == addr1.id

    # 3. Get Address by ID
    fetched = await service.get_address_by_id(u1.id, addr1.id)
    assert fetched.id == addr1.id

    # 4. Ownership check: u2 cannot get u1's address
    with pytest.raises(AddressOwnershipError):
        await service.get_address_by_id(u2.id, addr1.id)

    # 5. Non-existent address check
    random_id = uuid.uuid4()
    with pytest.raises(AddressNotFoundError):
        await service.get_address_by_id(u1.id, random_id)

    # 6. Update address by u1
    update_in = AddressUpdate(
        full_name="John Updated",
        city="Brooklyn",
    )
    updated = await service.update_address(u1.id, addr1.id, update_in)
    assert updated.full_name == "John Updated"
    assert updated.city == "Brooklyn"

    # 7. Update address by u2 should fail with ownership error
    with pytest.raises(AddressOwnershipError):
        await service.update_address(u2.id, addr1.id, update_in)

    # 8. Delete address by u2 should fail
    with pytest.raises(AddressOwnershipError):
        await service.delete_address(u2.id, addr1.id)

    # 9. Delete address by u1 should succeed
    await service.delete_address(u1.id, addr1.id)
    u1_addresses_after = await service.get_user_addresses(u1.id)
    assert len(u1_addresses_after) == 0


@pytest.mark.asyncio
async def test_address_service_default_switching(db_session):
    u = User(
        id=uuid.uuid4(),
        email=f"default_user_{uuid.uuid4()}@example.com",
        password_hash="hash",
        first_name="Default",
        last_name="Tester",
        role=RoleType.customer,
    )
    db_session.add(u)
    await db_session.commit()

    service = AddressService(db_session)

    # Create address 1 (default shipping & billing)
    addr1 = await service.create_address(
        u.id,
        AddressCreate(
            full_name="Addr 1",
            phone="12345678",
            address_line_1="Line 1",
            city="City 1",
            state="State 1",
            postal_code="12345",
            country="Country 1",
            address_type=AddressType.Home,
            is_default_shipping=True,
            is_default_billing=True,
        ),
    )

    # Create address 2 (default shipping & billing) -> should reset address 1 defaults
    addr2 = await service.create_address(
        u.id,
        AddressCreate(
            full_name="Addr 2",
            phone="87654321",
            address_line_1="Line 2",
            city="City 2",
            state="State 2",
            postal_code="54321",
            country="Country 2",
            address_type=AddressType.Office,
            is_default_shipping=True,
            is_default_billing=True,
        ),
    )

    # Refetch addr1
    addr1_refetched = await service.get_address_by_id(u.id, addr1.id)
    assert addr1_refetched.is_default_shipping is False
    assert addr1_refetched.is_default_billing is False

    # Switch default shipping back to addr1
    await service.set_default_shipping(u.id, addr1.id)
    addr1_after = await service.get_address_by_id(u.id, addr1.id)
    addr2_after = await service.get_address_by_id(u.id, addr2.id)
    assert addr1_after.is_default_shipping is True
    assert addr2_after.is_default_shipping is False

    # Switch default billing back to addr1
    await service.set_default_billing(u.id, addr1.id)
    addr1_after_billing = await service.get_address_by_id(u.id, addr1.id)
    addr2_after_billing = await service.get_address_by_id(u.id, addr2.id)
    assert addr1_after_billing.is_default_billing is True
    assert addr2_after_billing.is_default_billing is False
