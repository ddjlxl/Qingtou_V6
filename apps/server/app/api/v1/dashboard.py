from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.dashboard import (
    DashboardResponse,
    DashboardStats,
    StatusCounts,
    VehicleLocationItem,
)
from app.services.dashboard_service import get_dashboard

router = APIRouter(prefix="/dashboard", tags=["运营看板"])


@router.get("", response_model=DashboardResponse)
async def get_dashboard_api(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = await get_dashboard(db)
    return DashboardResponse(
        stats=DashboardStats(**data["stats"]),
        status_counts=StatusCounts(**data["status_counts"]),
        vehicles=[VehicleLocationItem(**v) for v in data["vehicles"]],
    )
