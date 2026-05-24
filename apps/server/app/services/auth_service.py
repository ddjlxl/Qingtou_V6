from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.core.security import create_token, verify_password
from app.models.user import User


async def login(db: AsyncSession, username: str, password: str) -> dict[str, Any]:
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()

    if not user:
        raise AppException(code=401, message="用户名或密码错误")

    if user.status == "disabled":
        raise AppException(code=403, message="账号已被禁用")

    if not verify_password(password, user.password):
        raise AppException(code=401, message="用户名或密码错误")

    user.last_login_at = datetime.now(timezone.utc)
    await db.commit()

    token = create_token(str(user.id))
    return {
        "token": token,
        "user": {
            "id": str(user.id),
            "username": user.username,
            "name": user.name,
            "role": user.role,
        },
    }
