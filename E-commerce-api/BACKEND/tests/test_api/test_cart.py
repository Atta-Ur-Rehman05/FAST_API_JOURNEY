import pytest
import uuid
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_get_my_cart(client: AsyncClient, auth_headers_customer: dict):
    response = await client.get("/api/v1/cart/me", headers=auth_headers_customer)
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["items"] == []

@pytest.mark.asyncio
async def test_add_cart_item(client: AsyncClient, auth_headers_customer: dict, auth_headers_admin: dict):
    # Setup Category and Product
    cat_res = await client.post("/api/v1/categories/", json={"name": "CartCat", "slug": "cart-cat"}, headers=auth_headers_admin)
    cat_id = cat_res.json()["id"]

    prod_res = await client.post("/api/v1/products/", json={
        "category_id": cat_id, "name": "CartProd", "slug": "cart-prod", "base_price": 50
    }, headers=auth_headers_admin)
    prod_id = prod_res.json()["id"]

    variant_res = await client.post(f"/api/v1/products/{prod_id}/variants", json={
        "sku": "CART-VAR-1", "price_modifier": 0, "stock_quantity": 10
    }, headers=auth_headers_admin)
    variant_id = variant_res.json()["id"]

    # Add to cart
    item_res = await client.post("/api/v1/cart/items", json={
        "variant_id": variant_id,
        "quantity": 2
    }, headers=auth_headers_customer)
    assert item_res.status_code == 201
    assert item_res.json()["quantity"] == 2
    assert item_res.json()["unit_price"] == "50.00"

    # Update item
    item_id = item_res.json()["id"]
    update_res = await client.patch(f"/api/v1/cart/items/{item_id}", json={
        "quantity": 5
    }, headers=auth_headers_customer)
    assert update_res.status_code == 200
    assert update_res.json()["quantity"] == 5

    # Delete item
    del_res = await client.delete(f"/api/v1/cart/items/{item_id}", headers=auth_headers_customer)
    assert del_res.status_code == 204

@pytest.mark.asyncio
async def test_clear_my_cart(client: AsyncClient, auth_headers_customer: dict):
    res = await client.delete("/api/v1/cart/items", headers=auth_headers_customer)
    assert res.status_code == 204


@pytest.mark.asyncio
async def test_cart_errors(client: AsyncClient, auth_headers_customer: dict, auth_headers_admin: dict):
    # Setup Category and Product
    cat_res = await client.post("/api/v1/categories/", json={"name": "ErrCat", "slug": "err-cat"}, headers=auth_headers_admin)
    cat_id = cat_res.json()["id"]

    prod_res = await client.post("/api/v1/products/", json={
        "category_id": cat_id, "name": "ErrProd", "slug": "err-prod", "base_price": 50
    }, headers=auth_headers_admin)
    prod_id = prod_res.json()["id"]

    variant_res = await client.post(f"/api/v1/products/{prod_id}/variants", json={
        "sku": "ERR-VAR-1", "price_modifier": 0, "stock_quantity": 5
    }, headers=auth_headers_admin)
    variant_id = variant_res.json()["id"]

    # 1. ProductUnavailableError (if inactive) -> Wait, no endpoint to set product inactive currently, let's just test VariantNotFoundError
    res = await client.post("/api/v1/cart/items", json={
        "variant_id": str(uuid.uuid4()),
        "quantity": 1
    }, headers=auth_headers_customer)
    assert res.status_code == 404

    # 2. InsufficientStockError
    res = await client.post("/api/v1/cart/items", json={
        "variant_id": variant_id,
        "quantity": 10
    }, headers=auth_headers_customer)
    assert res.status_code == 400

    # 3. Add valid item
    item_res = await client.post("/api/v1/cart/items", json={
        "variant_id": variant_id,
        "quantity": 2
    }, headers=auth_headers_customer)
    item_id = item_res.json()["id"]

    # 4. CartItemNotFoundError
    res = await client.delete("/api/v1/cart/items/9999", headers=auth_headers_customer)
    assert res.status_code == 404

    # 5. CartItemOwnershipError (Try with another user)
    # create new user inline
    other_user_res = await client.post("/api/v1/auth/register", json={
        "email": f"other_{uuid.uuid4()}@example.com",
        "password": "password123",
        "first_name": "Other",
        "last_name": "User"
    })
    
    # Login to get token
    login_res = await client.post("/api/v1/auth/login", data={
        "username": other_user_res.json()["email"],
        "password": "password123"
    })
    other_token = login_res.json()["access_token"]
    auth_headers_other = {"Authorization": f"Bearer {other_token}"}

    res_ownership = await client.delete(f"/api/v1/cart/items/{item_id}", headers=auth_headers_other)
    assert res_ownership.status_code == 400 # CartItemOwnershipError maps to 400

    # 6. Update to quantity exceeding stock (InsufficientStockError)
    res_update = await client.patch(f"/api/v1/cart/items/{item_id}", json={
        "quantity": 100
    }, headers=auth_headers_customer)
    assert res_update.status_code == 400
