import uuid
from datetime import date, datetime

from fastapi import APIRouter, Depends, File, Query, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth import get_current_user
from app.core.database import get_db
from app.core.exceptions import AppException
from app.models.driver import Driver
from app.models.transport_record import TransportRecord
from app.models.user import User
from app.models.vehicle import Vehicle
from app.schemas.fleet import (
    ImportResultResponse,
    TransportRecordListResponse,
    TransportRecordResponse,
    TransportRecordStatisticsResponse,
)
from app.services.fleet_service import (
    _validate_import_filename,
    get_transport_record_statistics,
    import_transport_records_from_content,
)

router = APIRouter(tags=["车队管理-运输流水"])


def _record_to_response(
    record: TransportRecord,
    vehicle_plate_no: str | None = None,
    driver_name: str | None = None,
) -> TransportRecordResponse:
    return TransportRecordResponse(
        id=str(record.id),
        order_no=record.order_no,
        customer_info=record.customer_info,
        origin=record.origin,
        destination=record.destination,
        container_no=record.container_no,
        vehicle_id=str(record.vehicle_id),
        vehicle_plate_no=vehicle_plate_no,
        driver_id=str(record.driver_id),
        driver_name=driver_name,
        imported_at=record.imported_at,
    )


@router.get("/transport-records", response_model=TransportRecordListResponse)
async def list_transport_records(
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    vehicle_id: str | None = Query(None),
    driver_id: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    base_query = select(TransportRecord)
    count_query = select(func.count(TransportRecord.id))

    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date)
            base_query = base_query.where(TransportRecord.imported_at >= start_dt)
            count_query = count_query.where(TransportRecord.imported_at >= start_dt)
        except ValueError:
            raise AppException(code=422, message="开始日期格式不正确")

    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date).replace(hour=23, minute=59, second=59)
            base_query = base_query.where(TransportRecord.imported_at <= end_dt)
            count_query = count_query.where(TransportRecord.imported_at <= end_dt)
        except ValueError:
            raise AppException(code=422, message="结束日期格式不正确")

    if vehicle_id:
        try:
            vid = uuid.UUID(vehicle_id)
        except ValueError:
            raise AppException(code=422, message="车辆 ID 格式不正确")
        base_query = base_query.where(TransportRecord.vehicle_id == vid)
        count_query = count_query.where(TransportRecord.vehicle_id == vid)

    if driver_id:
        try:
            did = uuid.UUID(driver_id)
        except ValueError:
            raise AppException(code=422, message="司机 ID 格式不正确")
        base_query = base_query.where(TransportRecord.driver_id == did)
        count_query = count_query.where(TransportRecord.driver_id == did)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    offset = (page - 1) * page_size
    base_query = base_query.offset(offset).limit(page_size).order_by(TransportRecord.imported_at.desc())
    result = await db.execute(base_query)
    records = result.scalars().all()

    vehicle_ids = list({r.vehicle_id for r in records})
    driver_ids = list({r.driver_id for r in records})

    vehicle_map: dict[uuid.UUID, str] = {}
    if vehicle_ids:
        v_result = await db.execute(
            select(Vehicle.id, Vehicle.plate_no).where(Vehicle.id.in_(vehicle_ids))
        )
        vehicle_map = {row[0]: row[1] for row in v_result.all()}

    driver_map: dict[uuid.UUID, str] = {}
    if driver_ids:
        d_result = await db.execute(
            select(Driver.id, Driver.name).where(Driver.id.in_(driver_ids))
        )
        driver_map = {row[0]: row[1] for row in d_result.all()}

    items = [
        _record_to_response(
            r,
            vehicle_plate_no=vehicle_map.get(r.vehicle_id),
            driver_name=driver_map.get(r.driver_id),
        )
        for r in records
    ]

    return TransportRecordListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("/transport-records/import", response_model=ImportResultResponse)
async def import_transport_records(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _validate_import_filename(file.filename or "")

    content_bytes = await file.read()
    try:
        content = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        raise AppException(code=422, message="文件编码不支持，请使用 UTF-8 编码")

    result = await import_transport_records_from_content(db, content)
    if result["success_count"] == 0 and result["total_rows"] > 0:
        raise AppException(code=422, message="文件格式错误，请下载模板后重新填写")
    return result


@router.get("/transport-records/statistics", response_model=TransportRecordStatisticsResponse)
async def get_statistics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_transport_record_statistics(db)


@router.get("/transport-records/template")
async def download_template(
    current_user: User = Depends(get_current_user),
):
    template_content = "任务编号\t客户信息\t起运地\t目的地\t箱号\t执行车辆(车牌号)\t执行司机(手机号)\n"
    template_bytes = template_content.encode("utf-8")

    return StreamingResponse(
        iter([template_bytes]),
        media_type="text/plain",
        headers={
            "Content-Disposition": "attachment; filename=transport_record_template.txt",
        },
    )