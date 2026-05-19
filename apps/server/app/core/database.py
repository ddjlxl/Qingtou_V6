from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.logger import setup_logger

_POOL_SIZE = 10
_MAX_OVERFLOW = 20
_MAX_TOTAL = _POOL_SIZE + _MAX_OVERFLOW

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    pool_size=_POOL_SIZE,
    max_overflow=_MAX_OVERFLOW,
    pool_pre_ping=True,
    pool_recycle=3600,
)

logger = setup_logger("database")


@event.listens_for(engine.sync_engine, "checkout")
def _on_checkout(dbapi_connection, connection_record, connection_proxy):
    pool = engine.pool
    checked_out = pool.size() - pool.checkedin()
    if checked_out >= _MAX_TOTAL * 0.8:
        logger.warning(
            "连接池使用率过高 checked_out=%d/%d overflow=%d pool_size=%d",
            checked_out,
            _MAX_TOTAL,
            pool.overflow(),
            _POOL_SIZE,
        )


@event.listens_for(engine.sync_engine, "connect")
def _on_connect(dbapi_connection, connection_record):
    pool = engine.pool
    logger.debug(
        "新建数据库连接 pooled=%d overflow=%d",
        pool.size(),
        pool.overflow(),
    )


def get_pool_status():
    pool = engine.pool
    checked_out = pool.size() - pool.checkedin()
    return {
        "pool_size": _POOL_SIZE,
        "max_overflow": _MAX_OVERFLOW,
        "checked_out": checked_out,
        "overflow": pool.overflow(),
        "total": pool.size(),
    }


AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session