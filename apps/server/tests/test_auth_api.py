import pytest
from httpx import AsyncClient


class TestLoginAPI:
    @pytest.mark.asyncio
    async def test_login_with_correct_credentials(self, client: AsyncClient, db_session):
        from tests.conftest import create_test_user
        await create_test_user(db_session, "testuser", "123456")

        response = await client.post("/api/v1/auth/login", json={
            "username": "testuser",
            "password": "123456",
        })

        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 200
        assert "token" in data["data"]
        assert data["data"]["user"]["username"] == "testuser"
        assert data["data"]["user"]["role"] == "dispatcher"

    @pytest.mark.asyncio
    async def test_login_with_wrong_password(self, client: AsyncClient, db_session):
        from tests.conftest import create_test_user
        await create_test_user(db_session, "testuser", "123456")

        response = await client.post("/api/v1/auth/login", json={
            "username": "testuser",
            "password": "wrong",
        })

        assert response.status_code == 401
        data = response.json()
        assert data["code"] == 401

    @pytest.mark.asyncio
    async def test_login_with_disabled_user(self, client: AsyncClient, db_session):
        from tests.conftest import create_test_user
        await create_test_user(db_session, "disabled_user", "123456", status="disabled")

        response = await client.post("/api/v1/auth/login", json={
            "username": "disabled_user",
            "password": "123456",
        })

        assert response.status_code == 403
        data = response.json()
        assert data["code"] == 403

    @pytest.mark.asyncio
    async def test_login_with_nonexistent_user(self, client: AsyncClient):
        response = await client.post("/api/v1/auth/login", json={
            "username": "nobody",
            "password": "123456",
        })

        assert response.status_code == 401
        data = response.json()
        assert data["code"] == 401

    @pytest.mark.asyncio
    async def test_login_updates_last_login_at(self, client: AsyncClient, db_session):
        from tests.conftest import create_test_user
        user = await create_test_user(db_session, "testuser", "123456")
        assert user.last_login_at is None

        await client.post("/api/v1/auth/login", json={
            "username": "testuser",
            "password": "123456",
        })

        await db_session.refresh(user)
        assert user.last_login_at is not None


class TestMeAPI:
    @pytest.mark.asyncio
    async def test_get_me_with_valid_token(self, client: AsyncClient, db_session):
        from tests.conftest import create_test_user
        await create_test_user(db_session, "testuser", "123456")

        login_resp = await client.post("/api/v1/auth/login", json={
            "username": "testuser",
            "password": "123456",
        })
        token = login_resp.json()["data"]["token"]

        response = await client.get("/api/v1/auth/me", headers={
            "Authorization": f"Bearer {token}",
        })

        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 200
        assert data["data"]["username"] == "testuser"

    @pytest.mark.asyncio
    async def test_get_me_without_token(self, client: AsyncClient):
        response = await client.get("/api/v1/auth/me")

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_me_with_invalid_token(self, client: AsyncClient):
        response = await client.get("/api/v1/auth/me", headers={
            "Authorization": "Bearer invalid.token.here",
        })

        assert response.status_code == 401
