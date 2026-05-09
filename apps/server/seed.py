import asyncio
import uuid

from app.core.database import AsyncSessionLocal, engine
from app.core.security import hash_password
from app.models import Base
from app.models.user import User, UserRole, UserStatus


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        users = [
            {
                "username": "admin",
                "password": "admin123",
                "name": "系统管理员",
                "role": UserRole.ADMIN.value,
            },
            {
                "username": "dispatcher",
                "password": "dispatcher123",
                "name": "调度员小王",
                "role": UserRole.DISPATCHER.value,
            },
            {
                "username": "driver",
                "password": "driver123",
                "name": "司机老张",
                "role": UserRole.DRIVER.value,
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
            )
            db.add(user)
            print(f"  创建用户: {u['username']} / {u['password']} ({u['name']}, {u['role']})")

        await db.commit()
        print("\n种子数据创建完成！")


if __name__ == "__main__":
    asyncio.run(seed())
