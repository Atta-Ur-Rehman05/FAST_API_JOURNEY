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
        "email": "testuser@example.com",
        "first_name": "Test",
        "last_name": "User",
        "role": "customer",
        "password": "strongpassword"
    }
    response = await client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == 400

@pytest.mark.asyncio
async def test_login_user(client: AsyncClient):
    login_data = {
        "username": "testuser@example.com",
        "password": "strongpassword"
    }
    response = await client.post("/api/v1/auth/login", data=login_data)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    login_data = {
        "username": "testuser@example.com",
        "password": "wrongpassword"
    }
    response = await client.post("/api/v1/auth/login", data=login_data)
    assert response.status_code == 400

