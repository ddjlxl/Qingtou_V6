import json
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.core.logger import setup_logger
from app.models.business_type_route import BusinessTypeRoute
from app.models.dispatch_address import DispatchAddress
from app.models.driver import Driver
from app.models.order import BusinessType, Order, OrderStatus
from app.models.transport_record import TransportRecord
from app.models.vehicle import Vehicle, VehicleStatus

logger = setup_logger("dispatch_service")


async def generate_order_no(db: AsyncSession) -> str:
    today_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    prefix = f"T{today_str}"

    result = await db.execute(
        select(Order.order_no)
        .where(Order.order_no.like(f"{prefix}%"))
        .order_by(Order.order_no.desc())
        .limit(1)
    )
    last_no = result.scalar_one_or_none()

    if last_no:
        seq = int(last_no[-4:]) + 1
    else:
        seq = 1

    return f"{prefix}{seq:04d}"


async def validate_container_no_unique(
    db: AsyncSession, container_no: str, exclude_order_id: uuid.UUID | None = None
) -> None:
    query = select(Order).where(
        Order.container_no == container_no,
        Order.status.in_([
            OrderStatus.PENDING.value,
            OrderStatus.ASSIGNED.value,
            OrderStatus.TRANSITING.value,
        ]),
    )
    if exclude_order_id:
        query = query.where(Order.id != exclude_order_id)

    result = await db.execute(query)
    if result.scalar_one_or_none():
        raise AppException(code=409, message="该箱号已有进行中的任务，请检查")


async def is_driver_available(db: AsyncSession, driver_id: uuid.UUID) -> bool:
    # Lock the driver row to prevent concurrent assignments
    driver_result = await db.execute(
        select(Driver).where(Driver.id == driver_id).with_for_update()
    )
    driver = driver_result.scalar_one_or_none()
    if not driver or driver.is_disabled:
        return False

    result = await db.execute(
        select(Order).where(
            Order.driver_id == driver_id,
            Order.status.in_([
                OrderStatus.ASSIGNED.value,
                OrderStatus.TRANSITING.value,
            ]),
        )
    )
    return result.scalar_one_or_none() is None


async def get_route_template(
    db: AsyncSession, business_type: str
) -> dict:
    result = await db.execute(
        select(BusinessTypeRoute)
        .where(BusinessTypeRoute.business_type == business_type)
        .limit(1)
    )
    route = result.scalar_one_or_none()
    if not route:
        raise AppException(code=404, message="该业务类型暂无路线模板")
    waypoints = None
    if route.waypoints:
        try:
            waypoints = json.loads(route.waypoints)
        except (json.JSONDecodeError, TypeError):
            waypoints = None
    return {
        "origin_name": route.origin_name,
        "waypoints": waypoints,
        "dest_name": route.dest_name,
    }


async def list_route_templates(db: AsyncSession) -> list[BusinessTypeRoute]:
    result = await db.execute(
        select(BusinessTypeRoute).order_by(BusinessTypeRoute.business_type)
    )
    return list(result.scalars().all())


async def update_route_template(
    db: AsyncSession, business_type: str, data: dict
) -> BusinessTypeRoute:
    waypoints_json = json.dumps(data["waypoints"], ensure_ascii=False) if data.get("waypoints") else None
    await db.execute(
        update(BusinessTypeRoute)
        .where(BusinessTypeRoute.business_type == business_type)
        .values(
            origin_name=data["origin_name"],
            waypoints=waypoints_json,
            dest_name=data["dest_name"],
        )
    )
    await db.commit()

    result = await db.execute(
        select(BusinessTypeRoute)
        .where(BusinessTypeRoute.business_type == business_type)
        .limit(1)
    )
    route = result.scalar_one_or_none()
    if not route:
        raise AppException(code=404, message="该业务类型暂无路线模板")
    return route


async def create_order(
    db: AsyncSession,
    data: dict,
    dispatcher_id: uuid.UUID,
) -> Order:
    container_no = data.get("container_no")
    if container_no:
        container_no = container_no.upper()
        await validate_container_no_unique(db, container_no)

    seal_no = data.get("seal_no")
    if seal_no:
        seal_no = seal_no.upper()

    origin_name = data.get("origin_name")
    dest_name = data.get("dest_name")
    if origin_name and dest_name and origin_name == dest_name:
        raise AppException(code=422, message="起运地和目的地不能相同")

    order_no = await generate_order_no(db)

    order = Order(
        id=uuid.uuid4(),
        order_no=order_no,
        status=OrderStatus.PENDING.value,
        dispatcher_id=dispatcher_id,
        customer_name=data.get("customer_name"),
        customer_phone=data.get("customer_phone"),
        origin_name=origin_name,
        dest_name=dest_name,
        waypoints=json.dumps(data["waypoints"], ensure_ascii=False) if data.get("waypoints") else None,
        container_no=container_no,
        container_type=data.get("container_type"),
        seal_no=seal_no,
        business_type=data.get("business_type"),
        container_status=data.get("container_status"),
        documents=json.dumps(data["documents"], ensure_ascii=False) if data.get("documents") else None,
        remark=data.get("remark"),
    )

    has_driver = data.get("driver_id") is not None
    has_vehicle = data.get("vehicle_id") is not None

    if has_driver and has_vehicle:
        driver_id = uuid.UUID(str(data["driver_id"]))
        vehicle_id = uuid.UUID(str(data["vehicle_id"]))

        if not await is_driver_available(db, driver_id):
            raise AppException(code=409, message="该司机已有进行中的任务")

        vehicle_result = await db.execute(
            select(Vehicle).where(Vehicle.id == vehicle_id)
        )
        vehicle = vehicle_result.scalar_one_or_none()
        if not vehicle or vehicle.is_disabled:
            raise AppException(code=409, message="车辆不可用")
        if vehicle.status != VehicleStatus.IDLE.value:
            raise AppException(code=409, message="车辆当前不可用")

        order.driver_id = driver_id
        order.vehicle_id = vehicle_id
        order.status = OrderStatus.ASSIGNED.value
        order.assigned_at = datetime.now(timezone.utc)
        vehicle.status = VehicleStatus.TRANSITING.value

    db.add(order)
    await db.commit()
    await db.refresh(order)
    return order


async def update_order(
    db: AsyncSession,
    order_id: uuid.UUID,
    data: dict,
) -> Order:
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise AppException(code=404, message="任务不存在")

    if order.status != OrderStatus.PENDING.value:
        raise AppException(code=422, message="仅待分配状态的任务可编辑")

    container_no = data.get("container_no")
    if container_no is not None:
        container_no = container_no.upper() if container_no else None
        if container_no:
            await validate_container_no_unique(db, container_no, exclude_order_id=order_id)

    seal_no = data.get("seal_no")
    if seal_no is not None:
        seal_no = seal_no.upper() if seal_no else None

    origin_name = data.get("origin_name")
    dest_name = data.get("dest_name")
    if origin_name is not None and dest_name is not None and origin_name == dest_name:
        raise AppException(code=422, message="起运地和目的地不能相同")

    updatable_fields = [
        "customer_name", "customer_phone", "origin_name",
        "dest_name", "container_type", "business_type",
        "container_status", "remark",
    ]
    for field in updatable_fields:
        if field in data and data[field] is not None:
            setattr(order, field, data[field])

    if "waypoints" in data:
        order.waypoints = json.dumps(data["waypoints"], ensure_ascii=False) if data["waypoints"] else None

    if "documents" in data:
        order.documents = json.dumps(data["documents"], ensure_ascii=False) if data["documents"] else None

    if container_no is not None:
        order.container_no = container_no
    if seal_no is not None:
        order.seal_no = seal_no

    await db.commit()
    await db.refresh(order)
    return order


async def assign_order(
    db: AsyncSession,
    order_id: uuid.UUID,
    driver_id: uuid.UUID,
    vehicle_id: uuid.UUID,
) -> Order:
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise AppException(code=404, message="任务不存在")

    if order.status != OrderStatus.PENDING.value:
        raise AppException(code=422, message="仅待分配状态的任务可分配")

    if not await is_driver_available(db, driver_id):
        raise AppException(code=409, message="该司机已有进行中的任务")

    vehicle_result = await db.execute(
        select(Vehicle).where(Vehicle.id == vehicle_id)
    )
    vehicle = vehicle_result.scalar_one_or_none()
    if not vehicle or vehicle.is_disabled:
        raise AppException(code=409, message="车辆不可用")
    if vehicle.status != VehicleStatus.IDLE.value:
        raise AppException(code=409, message="车辆当前不可用")

    order.driver_id = driver_id
    order.vehicle_id = vehicle_id
    order.status = OrderStatus.ASSIGNED.value
    order.assigned_at = datetime.now(timezone.utc)
    vehicle.status = VehicleStatus.TRANSITING.value

    await db.commit()
    await db.refresh(order)
    return order


async def complete_order(
    db: AsyncSession,
    order_id: uuid.UUID,
) -> Order:
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise AppException(code=404, message="任务不存在")

    allowed_statuses = {
        OrderStatus.PENDING.value,
        OrderStatus.ASSIGNED.value,
        OrderStatus.TRANSITING.value,
        OrderStatus.OVERDUE.value,
    }
    if order.status not in allowed_statuses:
        raise AppException(code=422, message="当前状态不允许标记完成")

    order.status = OrderStatus.COMPLETED.value
    order.completed_at = datetime.now(timezone.utc)

    if order.vehicle_id:
        vehicle_result = await db.execute(
            select(Vehicle).where(Vehicle.id == order.vehicle_id)
        )
        vehicle = vehicle_result.scalar_one_or_none()
        if vehicle:
            vehicle.status = VehicleStatus.IDLE.value

    if order.driver_id and order.vehicle_id:
        record = TransportRecord(
            id=uuid.uuid4(),
            order_no=order.order_no,
            customer_info=order.customer_name or "",
            container_status=order.container_status,
            origin=order.origin_name or "",
            destination=order.dest_name or "",
            container_no=order.container_no or "",
            vehicle_id=order.vehicle_id,
            driver_id=order.driver_id,
            imported_at=datetime.now(timezone.utc),
        )
        db.add(record)

    await db.commit()
    await db.refresh(order)
    return order


async def delete_order(
    db: AsyncSession,
    order_id: uuid.UUID,
) -> None:
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise AppException(code=404, message="任务不存在")

    if order.vehicle_id:
        vehicle_result = await db.execute(
            select(Vehicle).where(Vehicle.id == order.vehicle_id)
        )
        vehicle = vehicle_result.scalar_one_or_none()
        if vehicle and vehicle.status != VehicleStatus.IDLE.value:
            vehicle.status = VehicleStatus.IDLE.value

    # 同步删除关联的运输流水
    record_result = await db.execute(
        select(TransportRecord).where(TransportRecord.order_no == order.order_no)
    )
    record = record_result.scalar_one_or_none()
    if record:
        await db.delete(record)

    await db.delete(order)
    await db.commit()


async def get_available_resources(db: AsyncSession) -> dict:
    driver_result = await db.execute(
        select(Driver).where(Driver.is_disabled == False)
    )
    all_drivers = driver_result.scalars().all()

    busy_driver_result = await db.execute(
        select(Order.driver_id).where(
            Order.driver_id.isnot(None),
            Order.status.in_([
                OrderStatus.ASSIGNED.value,
                OrderStatus.TRANSITING.value,
            ]),
        )
    )
    busy_driver_ids = {row[0] for row in busy_driver_result.all()}

    available_drivers = []
    for d in all_drivers:
        if d.id not in busy_driver_ids:
            bound_plate = None
            if d.id:
                v_result = await db.execute(
                    select(Vehicle.plate_no).where(Vehicle.bound_driver_id == d.id)
                )
                bound_plate = v_result.scalar_one_or_none()
            available_drivers.append({
                "id": str(d.id),
                "name": d.name,
                "phone": d.phone,
                "bound_vehicle_plate_no": bound_plate,
            })

    vehicle_result = await db.execute(
        select(Vehicle).where(
            Vehicle.is_disabled == False,
            Vehicle.status == VehicleStatus.IDLE.value,
        )
    )
    all_vehicles = vehicle_result.scalars().all()

    available_vehicles = []
    for v in all_vehicles:
        bound_driver_name = None
        if v.bound_driver_id:
            d_result = await db.execute(
                select(Driver.name).where(Driver.id == v.bound_driver_id)
            )
            bound_driver_name = d_result.scalar_one_or_none()
        available_vehicles.append({
            "id": str(v.id),
            "plate_no": v.plate_no,
            "bound_driver_name": bound_driver_name,
        })

    return {
        "drivers": available_drivers,
        "vehicles": available_vehicles,
    }


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


async def check_order_overdue(db: AsyncSession | None = None) -> None:
    if db is not None:
        await _do_check_order_overdue(db)
        return

    from app.core.database import AsyncSessionLocal

    async with AsyncSessionLocal() as session:
        await _do_check_order_overdue(session)


async def _do_check_order_overdue(db: AsyncSession) -> None:
    four_hours_ago = datetime.now(timezone.utc) - timedelta(hours=4)

    result = await db.execute(
        select(Order).where(
            Order.status == OrderStatus.ASSIGNED.value,
            Order.assigned_at < four_hours_ago,
        )
    )
    overdue_orders = result.scalars().all()

    for order in overdue_orders:
        order.status = OrderStatus.OVERDUE.value
        if order.vehicle_id:
            vehicle_result = await db.execute(
                select(Vehicle).where(Vehicle.id == order.vehicle_id)
            )
            vehicle = vehicle_result.scalar_one_or_none()
            if vehicle:
                vehicle.status = VehicleStatus.OVERDUE.value

    if overdue_orders:
        logger.info("超时检测完成，标记 %d 个超时任务", len(overdue_orders))

    await db.commit()


async def get_order_status_counts(db: AsyncSession) -> dict:
    result = await db.execute(
        select(Order.status, func.count(Order.id)).group_by(Order.status)
    )
    counts = dict(result.all())

    return {
        "pending": counts.get(OrderStatus.PENDING.value, 0),
        "assigned": counts.get(OrderStatus.ASSIGNED.value, 0),
        "transiting": counts.get(OrderStatus.TRANSITING.value, 0),
        "completed": counts.get(OrderStatus.COMPLETED.value, 0),
        "overdue": counts.get(OrderStatus.OVERDUE.value, 0),
    }