import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_category_admin(client: AsyncClient, auth_headers_admin: dict):
    category_data = {
        "name": "Electronics",
        "slug": "electronics"
    }
    response = await client.post("/api/v1/categories/", json=category_data, headers=auth_headers_admin)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Electronics"
    assert data["id"] is not None

@pytest.mark.asyncio
async def test_create_category_customer_forbidden(client: AsyncClient, auth_headers_customer: dict):
    category_data = {
        "name": "Books",
        "slug": "books"
    }
    response = await client.post("/api/v1/categories/", json=category_data, headers=auth_headers_customer)
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_list_categories(client: AsyncClient, auth_headers_admin: dict):
    # Ensure one category exists
    await client.post("/api/v1/categories/", json={"name": "Toys", "slug": "toys"}, headers=auth_headers_admin)
    
    response = await client.get("/api/v1/categories/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0

@pytest.mark.asyncio
async def test_get_category_by_id(client: AsyncClient, auth_headers_admin: dict):
    create_res = await client.post("/api/v1/categories/", json={"name": "Mugs", "slug": "mugs"}, headers=auth_headers_admin)
    cat_id = create_res.json()["id"]

    response = await client.get(f"/api/v1/categories/{cat_id}")
    assert response.status_code == 200
    assert response.json()["name"] == "Mugs"

@pytest.mark.asyncio
async def test_update_category(client: AsyncClient, auth_headers_admin: dict):
    create_res = await client.post("/api/v1/categories/", json={"name": "Old", "slug": "old"}, headers=auth_headers_admin)
    cat_id = create_res.json()["id"]

    response = await client.patch(f"/api/v1/categories/{cat_id}", json={"name": "New"}, headers=auth_headers_admin)
    assert response.status_code == 200
    assert response.json()["name"] == "New"

@pytest.mark.asyncio
async def test_delete_category(client: AsyncClient, auth_headers_admin: dict):
    create_res = await client.post("/api/v1/categories/", json={"name": "DeleteMe", "slug": "delete-me"}, headers=auth_headers_admin)
    cat_id = create_res.json()["id"]

    response = await client.delete(f"/api/v1/categories/{cat_id}", headers=auth_headers_admin)
    assert response.status_code == 204

    get_res = await client.get(f"/api/v1/categories/{cat_id}")
    assert get_res.status_code == 404
