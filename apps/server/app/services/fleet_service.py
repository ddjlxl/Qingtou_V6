import os
import uuid
from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.core.logger import setup_logger
from app.models.certificate import Certificate
from app.models.vehicle import Vehicle, VehicleStatus

logger = setup_logger("fleet_service")

UPLOAD_BASE_DIR = "uploads"


def _safe_attachment_path(attachment: str) -> str:
    safe_name = os.path.basename(attachment)
    return os.path.join(UPLOAD_BASE_DIR, "certificates", safe_name)


async def update_vehicle_status(
    db: AsyncSession, vehicle_id: uuid.UUID, new_status: str
) -> None:
    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
    vehicle = result.scalar_one_or_none()
    if vehicle:
        vehicle.status = new_status
        await db.commit()


async def check_vehicle_availability(
    db: AsyncSession, vehicle_id: uuid.UUID
) -> bool:
    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
    vehicle = result.scalar_one_or_none()
    if not vehicle or vehicle.is_disabled:
        return False
    return vehicle.status == VehicleStatus.IDLE.value


async def get_certificate_warning_count(db: AsyncSession) -> int:
    today = date.today()
    thirty_days_later = today + timedelta(days=30)
    result = await db.execute(
        select(Certificate).where(
            Certificate.expiry_date >= today,
            Certificate.expiry_date <= thirty_days_later,
        )
    )
    return len(result.scalars().all())


async def check_certificate_expiry() -> None:
    from app.core.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        count = await get_certificate_warning_count(db)
        logger.info("证照预警检查完成，30天内到期证照数量：%d", count)


def delete_certificate_attachment(certificate: Certificate) -> None:
    if not certificate.attachment:
        return
    full_path = _safe_attachment_path(certificate.attachment)
    if os.path.exists(full_path):
        try:
            os.remove(full_path)
        except OSError as e:
            logger.warning("删除证照附件失败: %s, 错误: %s", full_path, e)


async def bind_driver_to_vehicle(
    db: AsyncSession,
    vehicle_id: uuid.UUID,
    driver_id: uuid.UUID,
    confirmed: bool = False,
) -> dict:
    result = await db.execute(
        select(Vehicle).where(Vehicle.bound_driver_id == driver_id)
    )
    existing_vehicle = result.scalar_one_or_none()

    if existing_vehicle and existing_vehicle.id != vehicle_id:
        if not confirmed:
            return {
                "need_confirm": True,
                "message": f"该司机已关联车辆 {existing_vehicle.plate_no}，是否更换关联？",
                "old_vehicle_id": str(existing_vehicle.id),
                "old_vehicle_plate_no": existing_vehicle.plate_no,
            }
        existing_vehicle.bound_driver_id = None

    if existing_vehicle and existing_vehicle.id == vehicle_id:
        return {"need_confirm": False, "message": "该司机已绑定到当前车辆"}

    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        raise AppException(code=404, message="车辆不存在")

    vehicle.bound_driver_id = driver_id
    await db.commit()
    return {"need_confirm": False, "message": "司机绑定成功"}