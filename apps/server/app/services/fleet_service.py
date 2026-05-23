import json
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


IMPORT_EXPECTED_COLUMNS = 7
ALLOWED_IMPORT_EXTENSIONS = {".xlsx", ".txt"}
VALID_CONTAINER_STATUSES = {"heavy", "empty"}


def _validate_import_filename(filename: str) -> str:
    if not filename:
        raise AppException(code=422, message="文件名不能为空")
    dot_index = filename.rfind(".")
    if dot_index == -1:
        raise AppException(code=422, message="仅支持 Excel (.xlsx) 或 txt 格式")
    ext = filename[dot_index:].lower()
    if ext not in ALLOWED_IMPORT_EXTENSIONS:
        raise AppException(
            code=422,
            message=f"仅支持 Excel (.xlsx) 或 txt 格式",
        )
    return ext


async def import_transport_records_from_content(
    db: AsyncSession, content: str
) -> dict:
    from app.models.driver import Driver
    from app.models.transport_record import TransportRecord
    from app.models.vehicle import Vehicle

    lines = [line.strip() for line in content.strip().split("\n") if line.strip()]

    # 跳过模板表头行
    start_index = 0
    if lines and lines[0].startswith("任务编号\t"):
        start_index = 1

    total_rows = len(lines) - start_index
    success_count = 0
    duplicate_count = 0
    error_count = 0
    errors: list[dict] = []

    for row_idx, line in enumerate(lines[start_index:], start=start_index + 1):
        columns = line.split("\t")
        if len(columns) != 9:
            error_count += 1
            errors.append({"row": row_idx, "message": f"列数不正确，期望 9 列，实际 {len(columns)} 列。请下载最新模板。"})
            continue

        order_no, customer_info, origin, waypoints_raw, destination, container_no, plate_no, phone, container_status_raw = columns
        waypoints_raw = waypoints_raw.strip()
        container_status_raw = container_status_raw.strip()

        # 处理途径地：逗号分隔 → JSON 数组
        waypoints_json = None
        if waypoints_raw:
            waypoints_list = [w.strip() for w in waypoints_raw.split(",") if w.strip()]
            if waypoints_list:
                waypoints_json = json.dumps(waypoints_list, ensure_ascii=False)

        # 校验 container_status
        if container_status_raw:
            if container_status_raw not in VALID_CONTAINER_STATUSES:
                error_count += 1
                errors.append({"row": row_idx, "message": f"空重箱状态值无效，应为 heavy 或 empty"})
                continue
            container_status = container_status_raw
        else:
            container_status = None

        existing = await db.execute(
            select(TransportRecord).where(TransportRecord.order_no == order_no)
        )
        if existing.scalar_one_or_none():
            duplicate_count += 1
            continue

        vehicle_result = await db.execute(
            select(Vehicle).where(Vehicle.plate_no == plate_no)
        )
        vehicle = vehicle_result.scalar_one_or_none()
        if not vehicle:
            error_count += 1
            errors.append({"row": row_idx, "message": f"车牌号 {plate_no} 不存在"})
            continue

        driver_result = await db.execute(
            select(Driver).where(Driver.phone == phone)
        )
        driver = driver_result.scalar_one_or_none()
        if not driver:
            error_count += 1
            errors.append({"row": row_idx, "message": f"手机号 {phone} 对应的司机不存在"})
            continue

        record = TransportRecord(
            id=uuid.uuid4(),
            order_no=order_no,
            customer_info=customer_info,
            container_status=container_status,
            origin=origin,
            destination=destination,
            waypoints=waypoints_json,
            container_no=container_no,
            vehicle_id=vehicle.id,
            driver_id=driver.id,
            business_date=date.today(),
        )
        db.add(record)
        success_count += 1

    if success_count > 0:
        await db.commit()

    return {
        "total_rows": total_rows,
        "success_count": success_count,
        "duplicate_count": duplicate_count,
        "error_count": error_count,
        "errors": errors if errors else None,
    }


async def get_transport_record_statistics(db: AsyncSession) -> dict:
    from sqlalchemy import func

    from app.models.driver import Driver
    from app.models.transport_record import TransportRecord
    from app.models.vehicle import Vehicle

    driver_stats_result = await db.execute(
        select(
            TransportRecord.driver_id,
            Driver.name,
            func.count(TransportRecord.id).label("count"),
        )
        .join(Driver, TransportRecord.driver_id == Driver.id)
        .group_by(TransportRecord.driver_id, Driver.name)
    )
    by_driver = [
        {"driver_id": str(row[0]), "driver_name": row[1], "count": row[2]}
        for row in driver_stats_result.all()
    ]

    vehicle_stats_result = await db.execute(
        select(
            TransportRecord.vehicle_id,
            Vehicle.plate_no,
            func.count(TransportRecord.id).label("count"),
        )
        .join(Vehicle, TransportRecord.vehicle_id == Vehicle.id)
        .group_by(TransportRecord.vehicle_id, Vehicle.plate_no)
    )
    by_vehicle = [
        {"vehicle_id": str(row[0]), "vehicle_plate_no": row[1], "count": row[2]}
        for row in vehicle_stats_result.all()
    ]

    return {"by_driver": by_driver, "by_vehicle": by_vehicle}


async def get_fleet_statistics(db: AsyncSession) -> dict:
    from datetime import date

    from sqlalchemy import func

    from app.models.transport_record import TransportRecord

    warning_count = await get_certificate_warning_count(db)

    today = date.today()
    month_start = today.replace(day=1)
    result = await db.execute(
        select(func.count(TransportRecord.id)).where(
            TransportRecord.business_date >= month_start
        )
    )
    month_task_count = result.scalar() or 0

    return {
        "certificate_warning_count": warning_count,
        "month_task_count": month_task_count,
    }