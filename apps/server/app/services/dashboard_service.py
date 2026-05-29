from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logger import setup_logger
from app.models.driver import Driver
from app.models.order import Order, OrderStatus
from app.models.vehicle import Vehicle
from app.services.dispatch_service import get_order_status_counts

logger = setup_logger("dashboard_service")


async def _get_today_task_count(db: AsyncSession) -> int:
    result = await db.execute(
        select(func.count(Order.id)).where(
            func.date(Order.created_at) == func.current_date()
        )
    )
    return result.scalar() or 0


async def _get_completion_rate(db: AsyncSession) -> float:
    non_pending_statuses = [
        OrderStatus.ASSIGNED.value,
        OrderStatus.TRANSITING.value,
        OrderStatus.COMPLETED.value,
        OrderStatus.OVERDUE.value,
    ]

    denominator_result = await db.execute(
        select(func.count(Order.id)).where(
            func.date(Order.created_at) == func.current_date(),
            Order.status.in_(non_pending_statuses),
        )
    )
    denominator = denominator_result.scalar() or 0

    if denominator == 0:
        return 0.0

    numerator_result = await db.execute(
        select(func.count(Order.id)).where(
            func.date(Order.created_at) == func.current_date(),
            Order.status == OrderStatus.COMPLETED.value,
        )
    )
    numerator = numerator_result.scalar() or 0

    return numerator / denominator


async def _get_overdue_count(db: AsyncSession) -> int:
    result = await db.execute(
        select(func.count(Order.id)).where(
            Order.status == OrderStatus.OVERDUE.value
        )
    )
    return result.scalar() or 0


async def _get_avg_transport_minutes(db: AsyncSession) -> float | None:
    result = await db.execute(
        select(
            func.avg(
                func.extract("epoch", Order.completed_at - Order.assigned_at) / 60
            )
        ).where(
            func.date(Order.created_at) == func.current_date(),
            Order.completed_at.isnot(None),
            Order.assigned_at.isnot(None),
        )
    )
    return result.scalar()


async def _get_vehicle_locations(db: AsyncSession) -> list[dict]:
    result = await db.execute(
        select(Vehicle, Driver)
        .outerjoin(Driver, Vehicle.bound_driver_id == Driver.id)
        .where(Vehicle.is_disabled == False)
    )
    rows = result.all()

    vehicles = []
    for vehicle, driver in rows:
        vehicles.append({
            "id": str(vehicle.id),
            "plate_no": vehicle.plate_no,
            "status": vehicle.status,
            "lat": float(vehicle.current_lat) if vehicle.current_lat is not None else None,
            "lng": float(vehicle.current_lng) if vehicle.current_lng is not None else None,
            "location": vehicle.current_location,
            "driver_name": driver.name if driver else None,
            "driver_phone": driver.phone if driver else None,
        })
    return vehicles


async def get_dashboard(db: AsyncSession) -> dict:
    status_counts = await get_order_status_counts(db)
    today_task_count = await _get_today_task_count(db)
    completion_rate = await _get_completion_rate(db)
    overdue_count = await _get_overdue_count(db)
    avg_transport_minutes = await _get_avg_transport_minutes(db)
    vehicles = await _get_vehicle_locations(db)

    return {
        "stats": {
            "today_task_count": today_task_count,
            "completion_rate": completion_rate,
            "overdue_count": overdue_count,
            "avg_transport_minutes": avg_transport_minutes,
        },
        "status_counts": status_counts,
        "vehicles": vehicles,
    }
