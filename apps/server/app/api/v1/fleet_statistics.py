from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.fleet import FleetStatisticsResponse
from app.services.fleet_service import get_fleet_statistics

router = APIRouter(tags=["车队管理-统计"])


@router.get("/statistics", response_model=FleetStatisticsResponse)
async def get_statistics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_fleet_statistics(db)