import os
import uuid
from collections.abc import AsyncGenerator

import asyncpg
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_token, hash_password
from app.models.base import Base
from app.models.user import User

_DB_NAME = "qingtou_v6_test"


def _get_test_db_url():
    base_url = settings.DATABASE_URL
    return base_url.rsplit("/", 1)[0] + "/" + _DB_NAME


def _get_admin_db_url():
    base_url = settings.DATABASE_URL
    admin_url = base_url.rsplit("/", 1)[0] + "/postgres"
    return admin_url.replace("+asyncpg", "")


TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", _get_test_db_url())
_DB_ADMIN_URL = os.getenv("TEST_DB_ADMIN_URL", _get_admin_db_url())


@pytest.fixture(scope="session", autouse=True)
def _prepare_db():
    import asyncio

    async def _setup():
        conn = await asyncpg.connect(_DB_ADMIN_URL)
        try:
            exists = await conn.fetchval(
                "SELECT 1 FROM pg_database WHERE datname = $1", _DB_NAME
            )
            if not exists:
                await conn.execute(f'CREATE DATABASE "{_DB_NAME}"')
        finally:
            await conn.close()

        temp_engine = create_async_engine(
            TEST_DATABASE_URL, echo=False, poolclass=NullPool
        )
        async with temp_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        await temp_engine.dispose()

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(_setup())
    yield
    loop.close()


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    engine = create_async_engine(
        TEST_DATABASE_URL, echo=False, poolclass=NullPool
    )
    connection = await engine.connect()
    transaction = await connection.begin()
    session = AsyncSession(bind=connection, expire_on_commit=False)
    try:
        yield session
    finally:
        await session.close()
        await transaction.rollback()
        await connection.close()
        await engine.dispose()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession):
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware

    from app.api.v1.auth import router as auth_router
    from app.api.v1.dispatch import router as dispatch_router
    from app.api.v1.fleet import router as fleet_router
    from app.core.exception_handlers import register_exception_handlers

    async def override_get_db():
        yield db_session

    test_app = FastAPI(title="Test App")
    register_exception_handlers(test_app)
    test_app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    test_app.include_router(auth_router, prefix="/api/v1")
    test_app.include_router(dispatch_router, prefix="/api/v1")
    test_app.include_router(fleet_router, prefix="/api/v1")
    test_app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=test_app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


async def create_test_user(
    db: AsyncSession,
    username: str,
    password: str,
    role: str = "dispatcher",
    status: str = "active",
):
    user = User(
        id=uuid.uuid4(),
        username=username,
        password=hash_password(password),
        name=username,
        role=role,
        status=status,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@pytest_asyncio.fixture
async def auth_headers(db_session: AsyncSession):
    user = await create_test_user(db_session, "testuser", "test123")
    token = create_token(str(user.id))
    return {"Authorization": f"Bearer {token}"}
