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
    assert "refresh_token" not in data
    assert data["token_type"] == "bearer"
    cookie = response.headers["set-cookie"]
    assert "HttpOnly" in cookie
    assert "SameSite=lax" in cookie

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
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"

@pytest.mark.asyncio
async def test_refresh_uses_http_only_cookie_and_logout_clears_it(client: AsyncClient):
    user_data = {
        "email": "cookieuser@example.com",
        "first_name": "Cookie",
        "last_name": "User",
        "role": "customer",
        "password": "strongpassword",
    }
    assert (await client.post("/api/v1/auth/register", json=user_data)).status_code == 201
    assert (await client.post("/api/v1/auth/login", data={"username": user_data["email"], "password": user_data["password"]})).status_code == 200

    refreshed = await client.post("/api/v1/auth/refresh", json={})
    assert refreshed.status_code == 200
    assert "access_token" in refreshed.json()
    assert "refresh_token" not in refreshed.json()

    logged_out = await client.post("/api/v1/auth/logout", json={})
    assert logged_out.status_code == 204
    assert "Max-Age=0" in logged_out.headers["set-cookie"]

@pytest.mark.asyncio
async def test_read_users_me(client: AsyncClient, auth_headers_customer: dict):
    response = await client.get("/api/v1/users/me", headers=auth_headers_customer)
    assert response.status_code == 200
    data = response.json()
    assert "email" in data

@pytest.mark.asyncio
async def test_health_exposes_request_id_and_security_headers(client: AsyncClient):
    response = await client.get("/health", headers={"X-Request-ID": "request-123"})
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    assert response.headers["X-Request-ID"] == "request-123"
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["Content-Security-Policy"] == "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"

