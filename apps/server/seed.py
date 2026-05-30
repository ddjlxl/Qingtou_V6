"""
种子数据脚本 — 仅用于本地开发环境，禁止在生产环境运行。
密码从项目根目录 .credentials.local 读取，不硬编码。
"""
import asyncio
import os
import uuid
from pathlib import Path

from dotenv import load_dotenv

from app.core.database import AsyncSessionLocal, engine
from app.core.security import hash_password
from app.models import Base
from app.models.user import User, UserRole, UserStatus

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
CREDENTIALS_FILE = PROJECT_ROOT / ".credentials.local"

if CREDENTIALS_FILE.exists():
    load_dotenv(CREDENTIALS_FILE)
else:
    print(f"[WARNING] 凭据文件不存在: {CREDENTIALS_FILE}，使用默认密码开发风险自负")


def _get_password(env_key: str, fallback: str) -> str:
    value = os.getenv(env_key, "").strip()
    if not value:
        print(f"[WARNING] {env_key} 未设置，使用弱默认密码，仅用于临时开发")
        return fallback
    return value


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        users = [
            {
                "username": "admin",
                "password": _get_password("ADMIN_PASSWORD", "admin123"),
                "name": "系统管理员",
                "role": UserRole.ADMIN.value,
            },
            {
                "username": "dispatcher",
                "password": _get_password("DISPATCHER_PASSWORD", "dispatcher123"),
                "name": "调度员小王",
                "role": UserRole.DISPATCHER.value,
            },
            {
                "username": "driver",
                "password": _get_password("DRIVER_PASSWORD", "driver123"),
                "name": "段江",
                "role": UserRole.DRIVER.value,
                "phone": "15388256973",
            },
        ]

        for u in users:
            user = User(
                id=uuid.uuid4(),
                username=u["username"],
                password=hash_password(u["password"]),
                name=u["name"],
                role=u["role"],
                status=UserStatus.ACTIVE.value,
                phone=u.get("phone"),
            )
            db.add(user)
            print(f"  创建用户: {u['username']} ({u['name']}, {u['role']})")

        await db.commit()
        print("\n种子数据创建完成！")


if __name__ == "__main__":
    asyncio.run(seed())
