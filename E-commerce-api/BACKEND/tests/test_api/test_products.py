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

@pytest.mark.asyncio
async def test_product_variants_and_images_crud(client: AsyncClient, auth_headers_admin: dict, test_category_id: int):
    # 1. Create product
    create_res = await client.post("/api/v1/products/", json={
        "category_id": test_category_id, "name": "FullProd", "slug": "full-prod", "base_price": 20
    }, headers=auth_headers_admin)
    prod_id = create_res.json()["id"]

    # 2. Duplicate slug error (400)
    dup_res = await client.post("/api/v1/products/", json={
        "category_id": test_category_id, "name": "FullProd2", "slug": "full-prod", "base_price": 20
    }, headers=auth_headers_admin)
    assert dup_res.status_code == 400

    # 3. Create & Update & Delete Variant
    v_res = await client.post(f"/api/v1/products/{prod_id}/variants", json={
        "sku": "FULL-V1", "price_modifier": 2.0, "stock_quantity": 50
    }, headers=auth_headers_admin)
    variant_id = v_res.json()["id"]

    v_patch = await client.patch(f"/api/v1/products/{prod_id}/variants/{variant_id}", json={
        "stock_quantity": 60
    }, headers=auth_headers_admin)
    assert v_patch.status_code == 200
    assert v_patch.json()["stock_quantity"] == 60

    # 4. Create & Update & Delete Image
    img_res = await client.post(f"/api/v1/products/{prod_id}/images", json={
        "image_url": "http://example.com/original.png", "is_primary": False
    }, headers=auth_headers_admin)
    img_id = img_res.json()["id"]

    img_patch = await client.patch(f"/api/v1/products/{prod_id}/images/{img_id}", json={
        "is_primary": True
    }, headers=auth_headers_admin)
    assert img_patch.status_code == 200
    assert img_patch.json()["is_primary"] is True

    # Delete image
    img_del = await client.delete(f"/api/v1/products/{prod_id}/images/{img_id}", headers=auth_headers_admin)
    assert img_del.status_code == 204

    # Delete variant
    v_del = await client.delete(f"/api/v1/products/{prod_id}/variants/{variant_id}", headers=auth_headers_admin)
    assert v_del.status_code == 204

    # Delete product
    prod_del = await client.delete(f"/api/v1/products/{prod_id}", headers=auth_headers_admin)
    assert prod_del.status_code == 204

@pytest.mark.asyncio
async def test_product_search_and_filters(client: AsyncClient, auth_headers_admin: dict, test_category_id: int):
    # Create products for search test
    await client.post("/api/v1/products/", json={
        "category_id": test_category_id, "name": "Apple iPhone 15", "slug": "apple-iphone-15", "base_price": 999
    }, headers=auth_headers_admin)
    await client.post("/api/v1/products/", json={
        "category_id": test_category_id, "name": "Samsung Galaxy", "slug": "samsung-galaxy", "base_price": 899
    }, headers=auth_headers_admin)

    # Search filter
    res = await client.get(f"/api/v1/products/?search=iPhone&category_id={test_category_id}")
    assert res.status_code == 200
    items = res.json()
    assert len(items) == 1
    assert items[0]["slug"] == "apple-iphone-15"

@pytest.mark.asyncio
async def test_product_not_found_errors(client: AsyncClient, auth_headers_admin: dict):
    fake_uuid = "00000000-0000-0000-0000-000000000000"
    get_res = await client.get(f"/api/v1/products/{fake_uuid}")
    assert get_res.status_code == 404

    del_res = await client.delete(f"/api/v1/products/{fake_uuid}", headers=auth_headers_admin)
    assert del_res.status_code == 404

