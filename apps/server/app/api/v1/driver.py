"""司机端 API — 司机工作台接口"""
import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1.auth import get_current_user
from app.core.database import get_db
from app.core.exceptions import AppException
from app.models.driver import Driver
from app.models.order import Order, OrderStatus
from app.models.user import User, UserRole
from app.schemas.dispatch import OrderListResponse, OrderResponse, OrderStatusCounts
from app.services.dispatch_service import complete_order

router = APIRouter(tags=["司机端"])


async def get_current_driver(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Driver:
    """校验当前用户为司机角色，返回 Driver 对象"""
    if current_user.role != UserRole.DRIVER.value:
        raise AppException(code=403, message="仅司机可访问")

    result = await db.execute(
        select(Driver).where(Driver.phone == current_user.phone)
    )
    driver = result.scalar_one_or_none()
    if not driver:
        raise AppException(code=404, message="司机信息不存在")
    return driver


def _order_to_response(order: Order) -> OrderResponse:
    waypoints = None
    if order.waypoints:
        try:
            waypoints = json.loads(order.waypoints)
        except (json.JSONDecodeError, TypeError):
            waypoints = None

    documents = None
    if order.documents:
        try:
            documents = json.loads(order.documents)
        except (json.JSONDecodeError, TypeError):
            documents = None

    return OrderResponse(
        id=str(order.id),
        order_no=order.order_no,
        status=order.status,
        customer_name=order.customer_name,
        customer_phone=order.customer_phone,
        origin_name=order.origin_name,
        dest_name=order.dest_name,
        waypoints=waypoints,
        container_no=order.container_no,
        container_type=order.container_type,
        seal_no=order.seal_no,
        business_type=order.business_type,
        container_status=order.container_status,
        documents=documents,
        driver_id=str(order.driver_id) if order.driver_id else None,
        driver_name=order.driver.name if order.driver else None,
        vehicle_id=str(order.vehicle_id) if order.vehicle_id else None,
        vehicle_plate_no=order.vehicle.plate_no if order.vehicle else None,
        dispatcher_id=str(order.dispatcher_id),
        dispatcher_name=order.dispatcher.name if order.dispatcher else None,
        remark=order.remark,
        assigned_at=order.assigned_at,
        started_at=order.started_at,
        completed_at=order.completed_at,
        created_at=order.created_at,
        updated_at=order.updated_at,
    )


@router.get("/driver/orders", response_model=OrderListResponse)
async def list_driver_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    driver: Driver = Depends(get_current_driver),
    db: AsyncSession = Depends(get_db),
):
    count_result = await db.execute(
        select(func.count(Order.id)).where(Order.driver_id == driver.id)
    )
    total = count_result.scalar() or 0

    offset = (page - 1) * page_size
    result = await db.execute(
        select(Order)
        .where(Order.driver_id == driver.id)
        .options(selectinload(Order.driver), selectinload(Order.vehicle), selectinload(Order.dispatcher))
        .order_by(Order.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    orders = result.scalars().all()

    # 计算当前司机的任务状态统计
    status_result = await db.execute(
        select(Order.status, func.count(Order.id))
        .where(Order.driver_id == driver.id)
        .group_by(Order.status)
    )
    status_map = dict(status_result.all())
    status_counts = OrderStatusCounts(
        pending=status_map.get(OrderStatus.PENDING.value, 0),
        assigned=status_map.get(OrderStatus.ASSIGNED.value, 0),
        transiting=status_map.get(OrderStatus.TRANSITING.value, 0),
        completed=status_map.get(OrderStatus.COMPLETED.value, 0),
        overdue=status_map.get(OrderStatus.OVERDUE.value, 0),
    )

    return OrderListResponse(
        items=[_order_to_response(o) for o in orders],
        total=total,
        page=page,
        page_size=page_size,
        status_counts=status_counts,
    )


@router.post("/driver/orders/{order_id}/start")
async def start_order(
    order_id: uuid.UUID,
    driver: Driver = Depends(get_current_driver),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise AppException(code=404, message="任务不存在")

    if order.driver_id != driver.id:
        raise AppException(code=403, message="这不是您的任务")

    if order.status != OrderStatus.ASSIGNED.value:
        raise AppException(code=422, message="仅已分配状态的任务可开始运输")

    order.status = OrderStatus.TRANSITING.value
    order.started_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(order)

    return _order_to_response(order)


@router.post("/driver/orders/{order_id}/complete")
async def driver_complete_order(
    order_id: uuid.UUID,
    driver: Driver = Depends(get_current_driver),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise AppException(code=404, message="任务不存在")

    if order.driver_id != driver.id:
        raise AppException(code=403, message="这不是您的任务")

    if order.status != OrderStatus.TRANSITING.value:
        raise AppException(code=422, message="仅运输中的任务可标记完成")

    completed = await complete_order(db, order_id)
    return _order_to_response(completed)
