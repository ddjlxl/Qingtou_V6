import uuid

from fastapi import APIRouter, Depends, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import AppException
from app.core.security import decode_token
from app.models.user import User
from app.schemas.auth import LoginRequest
from app.services.auth_service import login as auth_login

router = APIRouter(prefix="/auth", tags=["认证"])


async def get_current_user(
    authorization: str | None = Header(None),
    db: AsyncSession = Depends(get_db),
):
    if not authorization:
        raise AppException(code=401, message="认证失败")
    token = authorization.replace("Bearer ", "")
    payload = decode_token(token)
    result = await db.execute(select(User).where(User.id == uuid.UUID(payload["sub"])))
    user = result.scalar_one_or_none()
    if not user:
        raise AppException(code=401, message="用户不存在")
    return user


@router.post("/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await auth_login(db, req.username, req.password)
    return {"code": 200, "message": "登录成功", "data": result}


@router.get("/me")
async def get_me(user: User = Depends(get_current_user)):
    return {
        "code": 200,
        "data": {
            "id": str(user.id),
            "username": user.username,
            "name": user.name,
            "role": user.role,
        },
    }
