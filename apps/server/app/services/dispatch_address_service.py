import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.core.logger import setup_logger
from app.models.dispatch_address import DispatchAddress

logger = setup_logger("dispatch_address_service")


async def get_dispatch_addresses(
    db: AsyncSession, user_id: uuid.UUID
) -> list[DispatchAddress]:
    result = await db.execute(
        select(DispatchAddress)
        .where(DispatchAddress.user_id == user_id)
        .order_by(DispatchAddress.created_at.desc())
    )
    return list(result.scalars().all())


async def create_dispatch_address(
    db: AsyncSession, user_id: uuid.UUID, name: str
) -> DispatchAddress:
    existing = await db.execute(
        select(DispatchAddress).where(
            DispatchAddress.user_id == user_id,
            DispatchAddress.name == name,
        )
    )
    if existing.scalar_one_or_none():
        raise AppException(code=409, message="该地址已存在")

    address = DispatchAddress(
        id=uuid.uuid4(),
        user_id=user_id,
        name=name,
    )
    db.add(address)
    await db.commit()
    await db.refresh(address)
    return address


async def delete_dispatch_address(
    db: AsyncSession, address_id: uuid.UUID, user_id: uuid.UUID
) -> None:
    result = await db.execute(
        select(DispatchAddress).where(
            DispatchAddress.id == address_id,
            DispatchAddress.user_id == user_id,
        )
    )
    address = result.scalar_one_or_none()
    if not address:
        raise AppException(code=404, message="地址不存在")

    await db.delete(address)
    await db.commit()
