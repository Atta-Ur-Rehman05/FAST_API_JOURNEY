import pytest
import pytest_asyncio
from httpx import AsyncClient

@pytest_asyncio.fixture()
async def test_category_id(client: AsyncClient, auth_headers_admin: dict):
    cat_res = await client.post("/api/v1/categories/", json={"name": "SetupCategory", "slug": "setup-category"}, headers=auth_headers_admin)
    return cat_res.json()["id"]

@pytest.mark.asyncio
async def test_create_product(client: AsyncClient, auth_headers_admin: dict, test_category_id: int):
    prod_data = {
        "category_id": test_category_id,
        "name": "Test Product",
        "slug": "test-product",
        "description": "Details",
        "base_price": 99.99
    }
    response = await client.post("/api/v1/products/", json=prod_data, headers=auth_headers_admin)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Product"
    assert "id" in data

@pytest.mark.asyncio
async def test_get_product(client: AsyncClient, auth_headers_admin: dict, test_category_id: int):
    create_res = await client.post("/api/v1/products/", json={
        "category_id": test_category_id, "name": "Prod2", "slug": "prod2", "base_price": 10
    }, headers=auth_headers_admin)
    prod_id = create_res.json()["id"]

    response = await client.get(f"/api/v1/products/{prod_id}")
    assert response.status_code == 200
    assert response.json()["name"] == "Prod2"

@pytest.mark.asyncio
async def test_update_product(client: AsyncClient, auth_headers_admin: dict, test_category_id: int):
    create_res = await client.post("/api/v1/products/", json={
        "category_id": test_category_id, "name": "Prod3", "slug": "prod3", "base_price": 15
    }, headers=auth_headers_admin)
    prod_id = create_res.json()["id"]

    response = await client.patch(f"/api/v1/products/{prod_id}", json={"name": "Prod3Updated"}, headers=auth_headers_admin)
    assert response.status_code == 200
    assert response.json()["name"] == "Prod3Updated"

@pytest.mark.asyncio
async def test_list_products(client: AsyncClient):
    response = await client.get("/api/v1/products/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_create_variant(client: AsyncClient, auth_headers_admin: dict, test_category_id: int):
    create_res = await client.post("/api/v1/products/", json={
        "category_id": test_category_id, "name": "ProdVariant", "slug": "prod-variant", "base_price": 10
    }, headers=auth_headers_admin)
    prod_id = create_res.json()["id"]

    variant_data = {
        "sku": "PV-12345",
        "price_modifier": 5.00,
        "stock_quantity": 100
    }
    response = await client.post(f"/api/v1/products/{prod_id}/variants", json=variant_data, headers=auth_headers_admin)
    assert response.status_code == 201
    assert response.json()["sku"] == "PV-12345"

@pytest.mark.asyncio
async def test_create_image(client: AsyncClient, auth_headers_admin: dict, test_category_id: int):
    create_res = await client.post("/api/v1/products/", json={
        "category_id": test_category_id, "name": "ProdImg", "slug": "prod-img", "base_price": 10
    }, headers=auth_headers_admin)
    prod_id = create_res.json()["id"]

    image_data = {
        "image_url": "http://example.com/img.jpg",
        "is_primary": True
    }
    response = await client.post(f"/api/v1/products/{prod_id}/images", json=image_data, headers=auth_headers_admin)
    assert response.status_code == 201
    assert response.json()["image_url"] == "http://example.com/img.jpg"
