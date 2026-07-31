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

@pytest.mark.asyncio
async def test_category_tree_and_parent_errors(client: AsyncClient, auth_headers_admin: dict):
    # 1. Create parent category
    parent_res = await client.post("/api/v1/categories/", json={"name": "ParentCat", "slug": "parent-cat"}, headers=auth_headers_admin)
    parent_id = parent_res.json()["id"]

    # 2. Create child category
    child_res = await client.post("/api/v1/categories/", json={
        "name": "ChildCat", "slug": "child-cat", "parent_id": parent_id
    }, headers=auth_headers_admin)
    assert child_res.status_code == 201

    # 3. Get category tree
    tree_res = await client.get("/api/v1/categories/tree")
    assert tree_res.status_code == 200
    assert len(tree_res.json()) > 0

    # 4. Duplicate slug error (400)
    dup_res = await client.post("/api/v1/categories/", json={"name": "DupCat", "slug": "parent-cat"}, headers=auth_headers_admin)
    assert dup_res.status_code == 400

    # 5. Invalid parent category error (404)
    invalid_parent_res = await client.post("/api/v1/categories/", json={"name": "BadParentCat", "slug": "bad-parent-cat", "parent_id": 999999}, headers=auth_headers_admin)
    assert invalid_parent_res.status_code == 404

    # 6. Self parent error (400)
    self_parent_res = await client.patch(f"/api/v1/categories/{parent_id}", json={"parent_id": parent_id}, headers=auth_headers_admin)
    assert self_parent_res.status_code == 400

