import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1.auth import get_current_user
from app.core.database import get_db
from app.core.exceptions import AppException
from app.models.order import Order
from app.models.user import User
from app.models.vehicle import Vehicle
from app.schemas.dispatch import (
    AvailableDriver,
    AvailableResourcesResponse,
    AvailableVehicle,
    DispatchAddressCreate,
    DispatchAddressListResponse,
    DispatchAddressResponse,
    RouteTemplateResponse,
    RouteTemplateUpdate,
    RouteTemplateListResponse,
    OrderAssign,
    OrderCreate,
    OrderListResponse,
    OrderResponse,
    OrderStatusCounts,
    OrderUpdate,
)
from app.services.dispatch_service import (
    assign_order,
    complete_order,
    create_dispatch_address,
    create_order,
    delete_dispatch_address,
    delete_order,
    get_available_resources,
    get_dispatch_addresses,
    get_route_template,
    list_route_templates,
    update_route_template,
    get_order_status_counts,
    order_to_response,
    update_order,
)

router = APIRouter(prefix="/dispatch", tags=["调度中心"])


def _order_to_response(order: Order) -> OrderResponse:
    return OrderResponse(**order_to_response(order))


@router.get("/orders/available-resources", response_model=AvailableResourcesResponse)
async def list_available_resources(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resources = await get_available_resources(db)
    return AvailableResourcesResponse(
        drivers=[AvailableDriver(**d) for d in resources["drivers"]],
        vehicles=[AvailableVehicle(**v) for v in resources["vehicles"]],
    )


@router.get("/orders", response_model=OrderListResponse)
async def list_orders(
    status: str | None = Query(None),
    keyword: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    base_query = select(Order).options(
        selectinload(Order.driver), selectinload(Order.vehicle), selectinload(Order.dispatcher)
    )
    count_query = select(func.count(Order.id))

    if status:
        base_query = base_query.where(Order.status == status)
        count_query = count_query.where(Order.status == status)

    if keyword:
        keyword_filter = or_(
            Order.order_no.contains(keyword),
            Order.container_no.contains(keyword),
            Order.customer_name.contains(keyword),
            Vehicle.plate_no.contains(keyword),
        )
        base_query = base_query.outerjoin(Vehicle, Order.vehicle_id == Vehicle.id).where(keyword_filter)
        count_query = count_query.outerjoin(Vehicle, Order.vehicle_id == Vehicle.id).where(keyword_filter)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    offset = (page - 1) * page_size
    base_query = base_query.offset(offset).limit(page_size).order_by(Order.created_at.desc())
    result = await db.execute(base_query)
    orders = result.scalars().all()

    items = [_order_to_response(o) for o in orders]
    status_counts_data = await get_order_status_counts(db)

    return OrderListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        status_counts=OrderStatusCounts(**status_counts_data),
    )


@router.post("/orders", response_model=OrderResponse)
async def create_order_api(
    data: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = await create_order(db, data.model_dump(exclude_none=True), current_user.id)
    return _order_to_response(order)


@router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise AppException(code=404, message="任务不存在")
    return _order_to_response(order)


@router.put("/orders/{order_id}", response_model=OrderResponse)
async def update_order_api(
    order_id: uuid.UUID,
    data: OrderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = await update_order(db, order_id, data.model_dump(exclude_none=True))
    return _order_to_response(order)


@router.delete("/orders/{order_id}")
async def delete_order_api(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await delete_order(db, order_id)
    return {"message": "删除成功"}


@router.post("/orders/{order_id}/assign", response_model=OrderResponse)
async def assign_order_api(
    order_id: uuid.UUID,
    data: OrderAssign,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = await assign_order(db, order_id, data.driver_id, data.vehicle_id)
    return _order_to_response(order)


@router.post("/orders/{order_id}/complete", response_model=OrderResponse)
async def complete_order_api(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = await complete_order(db, order_id)
    return _order_to_response(order)


@router.get("/route-templates", response_model=RouteTemplateListResponse)
async def list_route_templates_api(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    templates = await list_route_templates(db)
    return RouteTemplateListResponse(
        items=[
            {
                "business_type": t.business_type,
                "origin_name": t.origin_name,
                "waypoints": json.loads(t.waypoints) if t.waypoints else None,
                "dest_name": t.dest_name,
                "documents": json.loads(t.documents) if t.documents else None,
                "container_status": t.container_status,
            }
            for t in templates
        ]
    )


@router.get("/route-templates/{business_type}", response_model=RouteTemplateResponse)
async def get_route_template_api(
    business_type: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await get_route_template(db, business_type)
    return RouteTemplateResponse(**result)


@router.put("/route-templates/{business_type}", response_model=RouteTemplateResponse)
async def update_route_template_api(
    business_type: str,
    data: RouteTemplateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated = await update_route_template(db, business_type, data.model_dump())
    waypoints = json.loads(updated.waypoints) if updated.waypoints else None
    documents = json.loads(updated.documents) if updated.documents else None
    return RouteTemplateResponse(
        origin_name=updated.origin_name,
        waypoints=waypoints,
        dest_name=updated.dest_name,
        documents=documents,
        container_status=updated.container_status,
    )


@router.get("/addresses", response_model=DispatchAddressListResponse)
async def list_addresses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    addresses = await get_dispatch_addresses(db, current_user.id)
    return DispatchAddressListResponse(
        items=[
            DispatchAddressResponse(
                id=str(a.id),
                name=a.name,
                created_at=a.created_at,
            )
            for a in addresses
        ]
    )


@router.post("/addresses", response_model=DispatchAddressResponse)
async def create_address(
    data: DispatchAddressCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    address = await create_dispatch_address(db, current_user.id, data.name)
    return DispatchAddressResponse(
        id=str(address.id),
        name=address.name,
        created_at=address.created_at,
    )


@router.delete("/addresses/{address_id}")
async def delete_address(
    address_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await delete_dispatch_address(db, address_id, current_user.id)
    return {"message": "删除成功"}