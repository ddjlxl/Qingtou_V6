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
    BindDriverResponse,
    VehicleAvailabilityResponse,
    VehicleBindDriver,
    VehicleCreate,
    VehicleListResponse,
    VehicleResponse,
    VehicleUpdate,
)
from app.services.fleet_service import (
    bind_driver_to_vehicle,
    check_vehicle_availability,
    delete_certificate_attachment,
)

router = APIRouter(tags=["车队管理-车辆"])


def _vehicle_to_response(vehicle: Vehicle, driver_name: str | None = None) -> VehicleResponse:
    return VehicleResponse(
        id=str(vehicle.id),
        plate_no=vehicle.plate_no,
        ownership=vehicle.ownership,
        bound_driver_id=str(vehicle.bound_driver_id) if vehicle.bound_driver_id else None,
        bound_driver_name=driver_name,
        status=vehicle.status,
        is_disabled=vehicle.is_disabled,
        created_at=vehicle.created_at,
        updated_at=vehicle.updated_at,
    )


@router.get("/vehicles", response_model=VehicleListResponse)
async def list_vehicles(
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    base_query = select(Vehicle)
    count_query = select(func.count(Vehicle.id))

    if status:
        base_query = base_query.where(Vehicle.status == status)
        count_query = count_query.where(Vehicle.status == status)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    offset = (page - 1) * page_size
    base_query = base_query.offset(offset).limit(page_size).order_by(Vehicle.created_at.desc())
    result = await db.execute(base_query)
    vehicles = result.scalars().all()

    driver_ids = [v.bound_driver_id for v in vehicles if v.bound_driver_id]
    driver_map: dict[uuid.UUID, str] = {}
    if driver_ids:
        driver_result = await db.execute(
            select(Driver.id, Driver.name).where(Driver.id.in_(driver_ids))
        )
        driver_map = {row[0]: row[1] for row in driver_result.all()}

    items = [
        _vehicle_to_response(v, driver_map.get(v.bound_driver_id) if v.bound_driver_id else None)
        for v in vehicles
    ]

    return VehicleListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/vehicles/{vehicle_id}", response_model=VehicleResponse)
async def get_vehicle(
    vehicle_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        raise AppException(code=404, message="车辆不存在")

    driver_name = None
    if vehicle.bound_driver_id:
        driver_result = await db.execute(
            select(Driver.name).where(Driver.id == vehicle.bound_driver_id)
        )
        driver_name = driver_result.scalar_one_or_none()

    return _vehicle_to_response(vehicle, driver_name)


@router.post("/vehicles", response_model=VehicleResponse)
async def create_vehicle(
    data: VehicleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = await db.execute(
        select(Vehicle).where(Vehicle.plate_no == data.plate_no)
    )
    if existing.scalar_one_or_none():
        raise AppException(code=409, message="车牌号已存在，请检查")

    vehicle = Vehicle(
        plate_no=data.plate_no,
        ownership=data.ownership,
    )
    db.add(vehicle)
    await db.commit()
    await db.refresh(vehicle)

    return _vehicle_to_response(vehicle)


@router.put("/vehicles/{vehicle_id}", response_model=VehicleResponse)
async def update_vehicle(
    vehicle_id: uuid.UUID,
    data: VehicleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        raise AppException(code=404, message="车辆不存在")

    if data.ownership is not None:
        vehicle.ownership = data.ownership
    if data.bound_driver_id is not None:
        vehicle.bound_driver_id = data.bound_driver_id

    await db.commit()
    await db.refresh(vehicle)

    driver_name = None
    if vehicle.bound_driver_id:
        driver_result = await db.execute(
            select(Driver.name).where(Driver.id == vehicle.bound_driver_id)
        )
        driver_name = driver_result.scalar_one_or_none()

    return _vehicle_to_response(vehicle, driver_name)


@router.delete("/vehicles/{vehicle_id}")
async def delete_vehicle(
    vehicle_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        raise AppException(code=404, message="车辆不存在")

    history_count = await db.execute(
        select(func.count(TransportRecord.id)).where(
            TransportRecord.vehicle_id == vehicle_id
        )
    )
    if history_count.scalar() > 0:
        raise AppException(
            code=409,
            message="该车辆有历史记录，无法删除，可标记为停用",
        )

    cert_result = await db.execute(
        select(Certificate).where(
            Certificate.owner_type == "vehicle",
            Certificate.owner_id == vehicle_id,
        )
    )
    certificates = cert_result.scalars().all()
    for cert in certificates:
        delete_certificate_attachment(cert)
        await db.delete(cert)

    await db.delete(vehicle)
    await db.commit()

    return {"code": 200, "message": "车辆已删除"}


@router.put("/vehicles/{vehicle_id}/disable")
async def disable_vehicle(
    vehicle_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        raise AppException(code=404, message="车辆不存在")

    vehicle.is_disabled = True
    await db.commit()

    return {"code": 200, "message": "车辆已停用"}


@router.post("/vehicles/{vehicle_id}/bind-driver", response_model=BindDriverResponse)
async def bind_driver(
    vehicle_id: uuid.UUID,
    data: VehicleBindDriver,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await bind_driver_to_vehicle(
        db, vehicle_id, data.driver_id, data.confirmed
    )
    return BindDriverResponse(**result)


@router.get("/vehicles/{vehicle_id}/availability", response_model=VehicleAvailabilityResponse)
async def get_vehicle_availability(
    vehicle_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    available = await check_vehicle_availability(db, vehicle_id)

    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
    vehicle = result.scalar_one_or_none()

    if not vehicle:
        return VehicleAvailabilityResponse(
            available=False,
            status="not_found",
            message="车辆不存在",
        )

    if vehicle.is_disabled:
        return VehicleAvailabilityResponse(
            available=False,
            status=vehicle.status,
            message="该车辆已停用",
        )

    if not available:
        return VehicleAvailabilityResponse(
            available=False,
            status=vehicle.status,
            message="该车辆正在运输中，请选择其他车辆",
        )

    return VehicleAvailabilityResponse(
        available=True,
        status=vehicle.status,
        message="车辆可用",
    )