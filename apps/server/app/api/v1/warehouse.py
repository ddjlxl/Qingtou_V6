from fastapi import APIRouter, Depends, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth import get_current_user
from app.core.database import get_db
from app.core.exceptions import ForbiddenException, ValidationException
from app.models.user import User, UserRole
from app.schemas.warehouse import (
    ImportInboundResponse,
    ManualInboundRequest,
    ManualInboundResponse,
    MoveRequest,
    MoveResponse,
    OutboundRequest,
    OutboundResponse,
    SearchResponse,
    SlotUpdateRequest,
    SlotUpdateResponse,
    WarehouseStatistics,
    ZoneListResponse,
    ZoneResponse,
)
from app.services.warehouse_service import get_statistics, get_zones, import_inbound, manual_inbound, move_slot, outbound, search_slots, update_slot

router = APIRouter(prefix="/warehouse", tags=["仓库管理"])


async def _require_warehouse_role(
    current_user: User = Depends(get_current_user),
) -> User:
    """要求当前用户为 admin 或 warehouse_keeper 角色"""
    if current_user.role not in {
        UserRole.ADMIN.value,
        UserRole.WAREHOUSE_KEEPER.value,
    }:
        raise ForbiddenException()
    return current_user


@router.get("/zones", response_model=ZoneListResponse)
async def list_zones(
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(_require_warehouse_role),
):
    zones = await get_zones(db)
    return ZoneListResponse(
        zones=[ZoneResponse(**z) for z in zones]
    )


@router.get("/statistics", response_model=WarehouseStatistics)
async def list_statistics(
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(_require_warehouse_role),
):
    stats = await get_statistics(db)
    return WarehouseStatistics(**stats)


@router.post("/slots/manual-inbound", response_model=ManualInboundResponse)
async def create_manual_inbound(
    request: ManualInboundRequest,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(_require_warehouse_role),
):
    items = [item.model_dump() for item in request.items]
    result = await manual_inbound(db, request.zone_code, items)
    await db.commit()
    return ManualInboundResponse(**result)


@router.post("/slots/import-inbound", response_model=ImportInboundResponse)
async def create_import_inbound(
    file: UploadFile = File(...),
    zone_code: str | None = None,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(_require_warehouse_role),
):
    if not file.filename or not file.filename.endswith(".xlsx"):
        raise ValidationException("仅支持 .xlsx 文件")

    content = await file.read()
    result = await import_inbound(db, zone_code, content)
    if result["stored_count"] > 0:
        await db.commit()
    return ImportInboundResponse(**result)


@router.post("/slots/outbound", response_model=OutboundResponse)
async def create_outbound(
    request: OutboundRequest,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(_require_warehouse_role),
):
    slot_ids = [item.slot_id for item in request.items]
    result = await outbound(db, slot_ids, request.business_type)
    await db.commit()
    return OutboundResponse(**result)


@router.post("/slots/move", response_model=MoveResponse)
async def create_move(
    request: MoveRequest,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(_require_warehouse_role),
):
    result = await move_slot(db, request.source_slot_id, request.target_slot_id)
    await db.commit()
    return result


@router.put("/slots/{slot_id}", response_model=SlotUpdateResponse)
async def update_slot_api(
    slot_id: str,
    request: SlotUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(_require_warehouse_role),
):
    data = request.model_dump(exclude_none=True)
    result = await update_slot(db, slot_id, data)
    await db.commit()
    return result


@router.get("/slots/search", response_model=SearchResponse)
async def search_slots_api(
    keyword: str = Query(min_length=1),
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(_require_warehouse_role),
):
    result = await search_slots(db, keyword)
    return SearchResponse(**result)
