import json

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppException
from app.core.logger import setup_logger
from app.models.business_type_route import BusinessTypeRoute

logger = setup_logger("route_template_service")


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
    documents = None
    if route.documents:
        try:
            documents = json.loads(route.documents)
        except (json.JSONDecodeError, TypeError):
            documents = None
    return {
        "origin_name": route.origin_name,
        "waypoints": waypoints,
        "dest_name": route.dest_name,
        "documents": documents,
        "container_status": route.container_status,
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
    documents_json = json.dumps(data["documents"], ensure_ascii=False) if data.get("documents") else None
    await db.execute(
        update(BusinessTypeRoute)
        .where(BusinessTypeRoute.business_type == business_type)
        .values(
            origin_name=data["origin_name"],
            waypoints=waypoints_json,
            dest_name=data["dest_name"],
            documents=documents_json,
            container_status=data.get("container_status"),
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
