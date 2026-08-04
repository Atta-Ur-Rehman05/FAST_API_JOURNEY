import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    user_data = {
        "email": "testuser@example.com",
        "first_name": "Test",
        "last_name": "User",
        "role": "customer",
        "password": "strongpassword"
    }
    response = await client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "testuser@example.com"
    assert "id" in data

@pytest.mark.asyncio
async def test_register_existing_user(client: AsyncClient):
    user_data = {
        "email": "duplicate@example.com",
        "first_name": "Test",
        "last_name": "User",
        "role": "customer",
        "password": "strongpassword"
    }
    # First registration should succeed
    res1 = await client.post("/api/v1/auth/register", json=user_data)
    assert res1.status_code == 201

    # Second registration with same email should fail with 400
    res2 = await client.post("/api/v1/auth/register", json=user_data)
    assert res2.status_code == 400

@pytest.mark.asyncio
async def test_login_user(client: AsyncClient):
    user_data = {
        "email": "loginuser@example.com",
        "first_name": "Login",
        "last_name": "User",
        "role": "customer",
        "password": "strongpassword"
    }
    reg_res = await client.post("/api/v1/auth/register", json=user_data)
    assert reg_res.status_code == 201

    login_data = {
        "username": "loginuser@example.com",
        "password": "strongpassword"
    }
    response = await client.post("/api/v1/auth/login", data=login_data)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    user_data = {
        "email": "wrongpassuser@example.com",
        "first_name": "Wrong",
        "last_name": "Pass",
        "role": "customer",
        "password": "strongpassword"
    }
    reg_res = await client.post("/api/v1/auth/register", json=user_data)
    assert reg_res.status_code == 201

    login_data = {
        "username": "wrongpassuser@example.com",
        "password": "wrongpassword"
    }
    response = await client.post("/api/v1/auth/login", data=login_data)
    assert response.status_code == 400

@pytest.mark.asyncio
async def test_read_users_me(client: AsyncClient, auth_headers_customer: dict):
    response = await client.get("/api/v1/users/me", headers=auth_headers_customer)
    assert response.status_code == 200
    data = response.json()
    assert "email" in data



