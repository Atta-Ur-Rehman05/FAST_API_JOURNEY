import pytest
from httpx import AsyncClient
import uuid

@pytest.mark.asyncio
async def test_inventory_lifecycle(
    client: AsyncClient,
    auth_headers_admin: dict,
    auth_headers_customer: dict
):
    # 1. Create a category
    cat_res = await client.post("/api/v1/categories/", json={
        "name": "Inventory Category", "slug": f"inv-cat-{uuid.uuid4()}"
    }, headers=auth_headers_admin)
    cat_id = cat_res.json()["id"]

    # 2. Create a product
    prod_res = await client.post("/api/v1/products/", json={
        "category_id": cat_id, "name": "Inventory Product",
        "slug": f"inv-prod-{uuid.uuid4()}", "base_price": 50.0
    }, headers=auth_headers_admin)
    prod_id = prod_res.json()["id"]

    # 3. Create a variant
    sku = f"INV-SKU-{uuid.uuid4()}"
    variant_res = await client.post(f"/api/v1/products/{prod_id}/variants", json={
        "sku": sku, "price_modifier": 0, "stock_quantity": 10
    }, headers=auth_headers_admin)
    variant_id = variant_res.json()["id"]

    # 4. List inventory
    list_res = await client.get("/api/v1/inventory/", headers=auth_headers_admin)
    assert list_res.status_code == 200
    inv_list = list_res.json()
    assert any(inv["variant_id"] == variant_id for inv in inv_list)

    # 5. Get inventory by id
    get_res = await client.get(f"/api/v1/inventory/{variant_id}", headers=auth_headers_admin)
    assert get_res.status_code == 200
    assert get_res.json()["stock_quantity"] == 10

    # 6. Get inventory by sku
    sku_res = await client.get(f"/api/v1/inventory/sku/{sku}", headers=auth_headers_admin)
    assert sku_res.status_code == 200
    assert sku_res.json()["variant_id"] == variant_id

    # 7. Set stock
    set_res = await client.patch(f"/api/v1/inventory/{variant_id}/stock", json={
        "stock_quantity": 15, "reason": "inventory reset"
    }, headers=auth_headers_admin)
    assert set_res.status_code == 200
    assert set_res.json()["stock_quantity"] == 15

    # 8. Restock
    restock_res = await client.post(f"/api/v1/inventory/{variant_id}/restock", json={
        "quantity": 5, "reason": "new shipment"
    }, headers=auth_headers_admin)
    assert restock_res.status_code == 200
    assert restock_res.json()["stock_quantity"] == 20

    # 9. Deduct
    deduct_res = await client.post(f"/api/v1/inventory/{variant_id}/deduct", json={
        "quantity": 3, "reason": "damaged"
    }, headers=auth_headers_admin)
    assert deduct_res.status_code == 200
    assert deduct_res.json()["stock_quantity"] == 17

    # 10. Release
    # Release works identical to restock but for different reason/context
    release_res = await client.post(f"/api/v1/inventory/{variant_id}/release", json={
        "quantity": 2, "reason": "released from reserved"
    }, headers=auth_headers_admin)
    assert release_res.status_code == 200
    assert release_res.json()["stock_quantity"] == 19

@pytest.mark.asyncio
async def test_inventory_errors(
    client: AsyncClient,
    auth_headers_admin: dict
):
    wrong_id = str(uuid.uuid4())
    wrong_sku = f"NON-EXISTENT-{uuid.uuid4()}"

    # Get non-existent variant
    res = await client.get(f"/api/v1/inventory/{wrong_id}", headers=auth_headers_admin)
    assert res.status_code == 404

    # Get non-existent sku
    res = await client.get(f"/api/v1/inventory/sku/{wrong_sku}", headers=auth_headers_admin)
    assert res.status_code == 404

    # Deduct more than available
    # Create product to test insufficient
    cat_res = await client.post("/api/v1/categories/", json={
        "name": "Inv Cat 2", "slug": f"inv-cat2-{uuid.uuid4()}"
    }, headers=auth_headers_admin)
    cat_id = cat_res.json()["id"]

    prod_res = await client.post("/api/v1/products/", json={
        "category_id": cat_id, "name": "Inv Prod 2",
        "slug": f"inv-prod2-{uuid.uuid4()}", "base_price": 50.0
    }, headers=auth_headers_admin)
    prod_id = prod_res.json()["id"]

    sku = f"INV-SKU2-{uuid.uuid4()}"
    variant_res = await client.post(f"/api/v1/products/{prod_id}/variants", json={
        "sku": sku, "price_modifier": 0, "stock_quantity": 5
    }, headers=auth_headers_admin)
    variant_id = variant_res.json()["id"]

    # Attempt deduct 10 from 5
    deduct_err = await client.post(f"/api/v1/inventory/{variant_id}/deduct", json={
        "quantity": 10, "reason": "large deduction"
    }, headers=auth_headers_admin)
    assert deduct_err.status_code == 400

@pytest.mark.asyncio
async def test_inventory_filters(
    client: AsyncClient,
    auth_headers_admin: dict
):
    # Test filters like low_stock_threshold, low_stock_only, out_of_stock_only
    # First, list all
    res_all = await client.get("/api/v1/inventory/", headers=auth_headers_admin)
    assert res_all.status_code == 200

    res_low = await client.get("/api/v1/inventory/?low_stock_only=true&low_stock_threshold=1000", headers=auth_headers_admin)
    assert res_low.status_code == 200
    
    res_out = await client.get("/api/v1/inventory/?out_of_stock_only=true", headers=auth_headers_admin)
    assert res_out.status_code == 200
