import pytest
from httpx import AsyncClient
import uuid
from app.models.models import Address, AddressType

@pytest.mark.asyncio
async def test_checkout_errors(client: AsyncClient, auth_headers_customer: dict, auth_headers_admin: dict, db_session, customer_user):
    # Setup addresses
    addr = Address(
        id=uuid.uuid4(),
        user_id=customer_user.id,
        address_type=AddressType.shipping,
        street_address="123 Main St",
        city="City",
        state="State",
        postal_code="12345",
        country="Country",
        phone_number="1234567890"
    )
    db_session.add(addr)
    await db_session.commit()
    address_id = str(addr.id)

    # 1. AddressNotFoundError
    res_not_found = await client.post("/api/v1/checkout/", json={
        "shipping_address_id": str(uuid.uuid4()),
        "billing_address_id": str(uuid.uuid4()),
        "payment_method": "credit_card"
    }, headers=auth_headers_customer)
    assert res_not_found.status_code == 404

    # 2. AddressOwnershipError
    other_user_res = await client.post("/api/v1/auth/register", json={
        "email": f"other_{uuid.uuid4()}@example.com",
        "password": "password123",
        "first_name": "Other",
        "last_name": "User"
    })
    login_res = await client.post("/api/v1/auth/login", data={"username": other_user_res.json()["email"], "password": "password123"})
    other_token = login_res.json()["access_token"]
    
    res_ownership = await client.post("/api/v1/checkout/", json={
        "shipping_address_id": address_id,
        "billing_address_id": address_id,
        "payment_method": "credit_card"
    }, headers={"Authorization": f"Bearer {other_token}"})
    assert res_ownership.status_code in [400, 403]

    # 3. CartNotFoundError or EmptyCartError
    checkout_data = {
        "shipping_address_id": address_id,
        "billing_address_id": address_id,
        "payment_method": "credit_card"     
    }
    response = await client.post("/api/v1/checkout/", json=checkout_data, headers=auth_headers_customer)
    assert response.status_code in [400, 404]

@pytest.mark.asyncio
async def test_checkout_success_and_stock_error(client: AsyncClient, auth_headers_customer: dict, auth_headers_admin: dict, db_session, customer_user):
    addr = Address(
        id=uuid.uuid4(),
        user_id=customer_user.id,
        address_type=AddressType.shipping,
        street_address="123 Main St",
        city="City",
        state="State",
        postal_code="12345",
        country="Country",
        phone_number="1234567890"
    )
    db_session.add(addr)
    await db_session.commit()

    # Create Product and Variant
    cat_res = await client.post("/api/v1/categories/", json={"name": "ChkCat", "slug": f"chk-cat-{uuid.uuid4()}"}, headers=auth_headers_admin)
    cat_id = cat_res.json()["id"]

    prod_res = await client.post("/api/v1/products/", json={
        "category_id": cat_id, "name": "ChkProd", "slug": f"chk-prod-{uuid.uuid4()}", "base_price": 100
    }, headers=auth_headers_admin)
    prod_id = prod_res.json()["id"]

    variant_res = await client.post(f"/api/v1/products/{prod_id}/variants", json={
        "sku": f"CHK-VAR-{uuid.uuid4()}", "price_modifier": 0, "stock_quantity": 2
    }, headers=auth_headers_admin)
    variant_id = variant_res.json()["id"]

    # Add to cart
    cart_add_res = await client.post("/api/v1/cart/items", json={"variant_id": variant_id, "quantity": 1}, headers=auth_headers_customer)
    assert cart_add_res.status_code == 201, cart_add_res.text

    # 4. Successful checkout
    checkout_payload = {
        "shipping_address_id": str(addr.id),
        "billing_address_id": str(addr.id),
        "payment_method": "credit_card"
    }
    idempotency_headers = {
        **auth_headers_customer,
        "Idempotency-Key": f"checkout-{uuid.uuid4()}",
    }
    res_success = await client.post(
        "/api/v1/checkout/", json=checkout_payload, headers=idempotency_headers
    )
    assert res_success.status_code == 201
    assert "id" in res_success.json()["order"]

    # Checkout reserves stock; it does not remove physical inventory until
    # the order is delivered.
    inventory_res = await client.get(
        f"/api/v1/inventory/{variant_id}", headers=auth_headers_admin
    )
    assert inventory_res.status_code == 200
    assert inventory_res.json()["stock_quantity"] == 2
    assert inventory_res.json()["reserved_quantity"] == 1
    assert inventory_res.json()["available_quantity"] == 1

    # Retrying after the cart has been cleared returns the original result;
    # it must not create another order or decrement stock again.
    retry_response = await client.post(
        "/api/v1/checkout/", json=checkout_payload, headers=idempotency_headers
    )
    assert retry_response.status_code == 201
    assert retry_response.json()["order"]["id"] == res_success.json()["order"]["id"]

    # 5. InsufficientStockError (second checkout try on new cart with more than remaining)
    # The first checkout clears the cart!
    # Wait, the stock is now 1. Let's add 2 to cart.
    await client.post("/api/v1/cart/items", json={"variant_id": variant_id, "quantity": 2}, headers=auth_headers_customer)
    
    res_stock_err = await client.post("/api/v1/checkout/", json={
        "shipping_address_id": str(addr.id),
        "billing_address_id": str(addr.id),
        "payment_method": "credit_card"
    }, headers=auth_headers_customer)
    assert res_stock_err.status_code == 400, f"Checkout succeeded instead of failing: {res_stock_err.json()}"
