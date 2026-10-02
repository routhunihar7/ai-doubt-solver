import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_register_and_login_flow(client: AsyncClient):
    # Register
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "newstudent@college.edu",
            "full_name": "New Student",
            "password": "Password1234!",
            "preferences": {"theme": "dark"}
        }
    )
    assert reg_res.status_code == 201, reg_res.text
    data = reg_res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "newstudent@college.edu"

    # Login
    login_res = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "newstudent@college.edu",
            "password": "Password1234!"
        }
    )
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert "access_token" in login_data

    # Me endpoint
    token = login_data["access_token"]
    me_res = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "newstudent@college.edu"

@pytest.mark.asyncio
async def test_invalid_login(client: AsyncClient):
    res = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "nonexistent@college.edu",
            "password": "WrongPassword!"
        }
    )
    assert res.status_code == 401

@pytest.mark.asyncio
async def test_unauthorized_access(client: AsyncClient):
    res = await client.get("/api/v1/auth/me")
    assert res.status_code == 401
