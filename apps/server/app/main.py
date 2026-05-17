from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.v1.auth import router as auth_router
from app.api.v1.dispatch import router as dispatch_router
from app.api.v1.fleet import router as fleet_router
from app.core.config import settings
from app.core.database import engine
from app.core.exception_handlers import register_exception_handlers
from app.core.logger import setup_logger
from app.scheduler import init_scheduler, shutdown_scheduler

logger = setup_logger("main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("数据库连接成功")
    except Exception as e:
        logger.warning("数据库连接失败，scheduler 将继续启动: %s", e)

    init_scheduler()
    yield
    shutdown_scheduler()


app = FastAPI(
    title="青投供应链 V6 API",
    version="1.0.0",
    lifespan=lifespan,
)

register_exception_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(dispatch_router, prefix="/api/v1")
app.include_router(fleet_router, prefix="/api/v1")


@app.get("/api/health")
async def health_check():
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception:
        db_status = "unavailable"
    return {"status": "ok", "database": db_status}
