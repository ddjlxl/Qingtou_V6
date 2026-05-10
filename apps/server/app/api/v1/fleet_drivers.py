import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth import get_current_user
from app.core.database import get_db
from app.core.exceptions import AppException
from app.models.certificate import Certificate
from app.models.driver import Driver
from app.models.transport_record import TransportRecord
from app.models.user import User
from app.models.vehicle import Vehicle
from app.schemas.fleet import (
    DriverCreate,
    DriverListResponse,
    DriverResponse,
    DriverUpdate,
)
from app.services.fleet_service import delete_certificate_attachment

router = APIRouter(tags=["车队管理-司机"])


def _driver_to_response(driver: Driver, bound_vehicle_id: str | None = None, bound_vehicle_plate_no: str | None = None) -> DriverResponse:
    return DriverResponse(
        id=str(driver.id),
        name=driver.name,
        phone=driver.phone,
        bound_vehicle_id=bound_vehicle_id,
        bound_vehicle_plate_no=bound_vehicle_plate_no,
        is_disabled=driver.is_disabled,
        created_at=driver.created_at,
        updated_at=driver.updated_at,
    )


@router.get("/drivers", response_model=DriverListResponse)
async def list_drivers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count_query = select(func.count(Driver.id))
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    offset = (page - 1) * page_size
    base_query = select(Driver).offset(offset).limit(page_size).order_by(Driver.created_at.desc())
    result = await db.execute(base_query)
    drivers = result.scalars().all()

    driver_ids = [d.id for d in drivers]
    vehicle_map: dict[uuid.UUID, tuple[str, str]] = {}
    if driver_ids:
        vehicle_result = await db.execute(
            select(Vehicle.bound_driver_id, Vehicle.id, Vehicle.plate_no).where(
                Vehicle.bound_driver_id.in_(driver_ids)
            )
        )
        for row in vehicle_result.all():
            vehicle_map[row[0]] = (str(row[1]), row[2])

    items = []
    for d in drivers:
        vehicle_info = vehicle_map.get(d.id)
        items.append(
            _driver_to_response(
                d,
                bound_vehicle_id=vehicle_info[0] if vehicle_info else None,
                bound_vehicle_plate_no=vehicle_info[1] if vehicle_info else None,
            )
        )

    return DriverListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/drivers/{driver_id}", response_model=DriverResponse)
async def get_driver(
    driver_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Driver).where(Driver.id == driver_id))
    driver = result.scalar_one_or_none()
    if not driver:
        raise AppException(code=404, message="司机不存在")

    vehicle_result = await db.execute(
        select(Vehicle.id, Vehicle.plate_no).where(Vehicle.bound_driver_id == driver_id)
    )
    vehicle_row = vehicle_result.first()

    return _driver_to_response(
        driver,
        bound_vehicle_id=str(vehicle_row[0]) if vehicle_row else None,
        bound_vehicle_plate_no=vehicle_row[1] if vehicle_row else None,
    )


@router.post("/drivers", response_model=DriverResponse)
async def create_driver(
    data: DriverCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = await db.execute(
        select(Driver).where(Driver.phone == data.phone)
    )
    if existing.scalar_one_or_none():
        raise AppException(code=409, message="手机号已存在，请检查")

    driver = Driver(
        name=data.name,
        phone=data.phone,
    )
    db.add(driver)
    await db.commit()
    await db.refresh(driver)

    return _driver_to_response(driver)


@router.put("/drivers/{driver_id}", response_model=DriverResponse)
async def update_driver(
    driver_id: uuid.UUID,
    data: DriverUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Driver).where(Driver.id == driver_id))
    driver = result.scalar_one_or_none()
    if not driver:
        raise AppException(code=404, message="司机不存在")

    if data.name is not None:
        driver.name = data.name
    if data.phone is not None:
        existing = await db.execute(
            select(Driver).where(Driver.phone == data.phone, Driver.id != driver_id)
        )
        if existing.scalar_one_or_none():
            raise AppException(code=409, message="手机号已存在，请检查")
        driver.phone = data.phone

    await db.commit()
    await db.refresh(driver)

    vehicle_result = await db.execute(
        select(Vehicle.id, Vehicle.plate_no).where(Vehicle.bound_driver_id == driver_id)
    )
    vehicle_row = vehicle_result.first()

    return _driver_to_response(
        driver,
        bound_vehicle_id=str(vehicle_row[0]) if vehicle_row else None,
        bound_vehicle_plate_no=vehicle_row[1] if vehicle_row else None,
    )


@router.delete("/drivers/{driver_id}")
async def delete_driver(
    driver_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Driver).where(Driver.id == driver_id))
    driver = result.scalar_one_or_none()
    if not driver:
        raise AppException(code=404, message="司机不存在")

    history_count = await db.execute(
        select(func.count(TransportRecord.id)).where(
            TransportRecord.driver_id == driver_id
        )
    )
    if history_count.scalar() > 0:
        raise AppException(
            code=409,
            message="该司机有历史记录，无法删除，可标记为停用",
        )

    cert_result = await db.execute(
        select(Certificate).where(
            Certificate.owner_type == "driver",
            Certificate.owner_id == driver_id,
        )
    )
    certificates = cert_result.scalars().all()
    for cert in certificates:
        delete_certificate_attachment(cert)
        await db.delete(cert)

    await db.delete(driver)
    await db.commit()

    return {"code": 200, "message": "司机已删除"}


@router.put("/drivers/{driver_id}/disable")
async def disable_driver(
    driver_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Driver).where(Driver.id == driver_id))
    driver = result.scalar_one_or_none()
    if not driver:
        raise AppException(code=404, message="司机不存在")

    driver.is_disabled = True
    await db.commit()

    return {"code": 200, "message": "司机已停用"}