import pytest
from httpx import AsyncClient
import uuid
from app.models.models import AddressType, OrderStatus

@pytest.mark.asyncio
async def test_order_lifecycle(client: AsyncClient, auth_headers_customer: dict, auth_headers_admin: dict, db_session, customer_user):
    # Setup Category, Product, Variant
    cat_res = await client.post("/api/v1/categories/", json={"name": "OrdCat", "slug": f"ord-cat-{uuid.uuid4()}"}, headers=auth_headers_admin)
    cat_id = cat_res.json()["id"]

    prod_res = await client.post("/api/v1/products/", json={
        "category_id": cat_id, "name": "OrdProd", "slug": f"ord-prod-{uuid.uuid4()}", "base_price": 50
    }, headers=auth_headers_admin)
    prod_id = prod_res.json()["id"]

    variant_res = await client.post(f"/api/v1/products/{prod_id}/variants", json={
        "sku": f"ORD-VAR-{uuid.uuid4()}", "price_modifier": 0, "stock_quantity": 20
    }, headers=auth_headers_admin)
    variant_id = variant_res.json()["id"]

    # Add address manually via api or db
    from app.models.models import Address
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

    # Create Order
    order_in = {
        "shipping_address_id": str(addr.id),
        "billing_address_id": str(addr.id),
        "total_amount": 100.0,
        "payment_method": "credit_card"
    }
    # Wait, there's no endpoint to create an order directly for user except checkout? 
    # Let me check if there's POST /api/v1/orders/
    # If not, I can just use checkout to create an order.
    await client.post("/api/v1/cart/items", json={"variant_id": variant_id, "quantity": 2}, headers=auth_headers_customer)
    checkout_res = await client.post("/api/v1/checkout/", json={
        "shipping_address_id": str(addr.id),
        "billing_address_id": str(addr.id),
        "payment_method": "credit_card"
    }, headers=auth_headers_customer)
    assert checkout_res.status_code == 201
    order_id = checkout_res.json()["order"]["id"]

    # List orders
    list_res = await client.get("/api/v1/orders/me", headers=auth_headers_customer)
    assert list_res.status_code == 200
    assert len(list_res.json()) > 0

    list_all_res = await client.get("/api/v1/orders/", headers=auth_headers_admin)
    assert list_all_res.status_code == 200

    # Get order
    get_res = await client.get(f"/api/v1/orders/{order_id}", headers=auth_headers_customer)
    assert get_res.status_code == 200

    # OrderNotFoundError
    res_not_found = await client.get(f"/api/v1/orders/{uuid.uuid4()}", headers=auth_headers_customer)
    assert res_not_found.status_code == 404

    # OrderOwnershipError
    other_user_res = await client.post("/api/v1/auth/register", json={
        "email": f"other_{uuid.uuid4()}@example.com",
        "password": "password123",
        "first_name": "Other",
        "last_name": "User"
    })
    login_res = await client.post("/api/v1/auth/login", data={"username": other_user_res.json()["email"], "password": "password123"})
    auth_headers_other = {"Authorization": f"Bearer {login_res.json()['access_token']}"}
    
    res_ownership = await client.get(f"/api/v1/orders/{order_id}", headers=auth_headers_other)
    assert res_ownership.status_code == 403 # Typically 403 or 400

    # Status changes use the explicit state-transition endpoint.
    update_res = await client.patch(f"/api/v1/orders/{order_id}/status", json={
        "order_status": OrderStatus.processing.value
    }, headers=auth_headers_admin)
    assert update_res.status_code == 200

    # Admin get order
    admin_get = await client.get(f"/api/v1/orders/{order_id}", headers=auth_headers_admin)
    assert admin_get.status_code == 200

    # Checkout has made this order pending/processing, so customers cannot
    # alter line items, pricing, totals, or inventory after purchase.
    add_item_res = await client.post(f"/api/v1/orders/{order_id}/items", json={
        "variant_id": str(variant_id),
        "quantity": 1
    }, headers=auth_headers_customer)
    assert add_item_res.status_code == 409

    # Financial records cannot be deleted; cancellation releases the checkout
    # reservation without changing physical stock.
    del_res = await client.delete(f"/api/v1/orders/{order_id}", headers=auth_headers_admin)
    assert del_res.status_code == 409

    cancel_res = await client.patch(f"/api/v1/orders/{order_id}/status", json={
        "order_status": OrderStatus.cancelled.value
    }, headers=auth_headers_admin)
    assert cancel_res.status_code == 200
    assert cancel_res.json()["order_status"] == OrderStatus.cancelled.value

    inventory_res = await client.get(
        f"/api/v1/inventory/{variant_id}", headers=auth_headers_admin
    )
    assert inventory_res.status_code == 200
    assert inventory_res.json()["stock_quantity"] == 20
    assert inventory_res.json()["reserved_quantity"] == 0
    assert inventory_res.json()["available_quantity"] == 20

    # A delivered order consumes the previously reserved physical inventory.
    add_again = await client.post(
        "/api/v1/cart/items",
        json={"variant_id": variant_id, "quantity": 1},
        headers=auth_headers_customer,
    )
    assert add_again.status_code == 201
    checkout_again = await client.post("/api/v1/checkout/", json={
        "shipping_address_id": str(addr.id),
        "billing_address_id": str(addr.id),
        "payment_method": "credit_card",
    }, headers=auth_headers_customer)
    assert checkout_again.status_code == 201
    delivered_order_id = checkout_again.json()["order"]["id"]

    for order_status in (OrderStatus.processing, OrderStatus.shipped, OrderStatus.delivered):
        status_res = await client.patch(
            f"/api/v1/orders/{delivered_order_id}/status",
            json={"order_status": order_status.value},
            headers=auth_headers_admin,
        )
        assert status_res.status_code == 200

    delivered_inventory = await client.get(
        f"/api/v1/inventory/{variant_id}", headers=auth_headers_admin
    )
    assert delivered_inventory.json()["stock_quantity"] == 19
    assert delivered_inventory.json()["reserved_quantity"] == 0
    assert delivered_inventory.json()["available_quantity"] == 19

@pytest.mark.asyncio
async def test_create_order_direct_and_address_errors(client: AsyncClient, auth_headers_customer: dict):
    fake_addr_id = str(uuid.uuid4())
    res = await client.post("/api/v1/orders/", json={
        "shipping_address_id": fake_addr_id,
        "billing_address_id": fake_addr_id
    }, headers=auth_headers_customer)
    assert res.status_code == 404
