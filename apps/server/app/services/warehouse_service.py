import io
import re
from collections import defaultdict
from datetime import datetime, timezone

import openpyxl
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import SYSTEM_USER_ID
from app.core.exceptions import AppException, BusinessRuleViolationError, ValidationException
from app.models.order import Order
from app.models.storage_slot import SlotStatus, StorageSlot
from app.models.warehouse import Warehouse

# 自动入库优先级：优先区域 → 剩余区域
AUTO_INBOUND_PRIORITY = [
    "3-20", "1-20", "6-1", "6-2", "6-3", "6-4", "6-5", "6-6",
    "3-5", "3-7", "2-13", "1-1",
]


async def get_zones(db: AsyncSession) -> list[dict]:
    """获取所有区域及库位，按 sort_order 排列（2 条 SQL，避免 N+1）"""
    result = await db.execute(
        select(Warehouse).order_by(Warehouse.sort_order)
    )
    warehouses = result.scalars().all()

    if not warehouses:
        return []

    wh_ids = [wh.id for wh in warehouses]
    slots_result = await db.execute(
        select(StorageSlot)
        .where(StorageSlot.warehouse_id.in_(wh_ids))
        .order_by(StorageSlot.warehouse_id, StorageSlot.row, StorageSlot.col)
    )
    all_slots = slots_result.scalars().all()

    slots_by_wh: dict = defaultdict(list)
    for s in all_slots:
        slots_by_wh[s.warehouse_id].append(s)

    zones = []
    for wh in warehouses:
        slots = slots_by_wh.get(wh.id, [])
        used_count = sum(1 for s in slots if s.status != SlotStatus.EMPTY.value)

        zones.append({
            "id": str(wh.id),
            "name": wh.name,
            "zone_code": wh.zone_code,
            "sort_order": wh.sort_order,
            "used_count": used_count,
            "total_count": len(slots),
            "slots": [
                {
                    "id": str(s.id),
                    "zone_code": s.zone_code,
                    "slot_no": s.slot_no,
                    "row": s.row,
                    "col": s.col,
                    "status": s.status,
                    "container_no": s.container_no,
                    "container_status": s.container_status,
                    "customer_name": s.customer_name,
                    "container_type": s.container_type,
                    "seal_no": s.seal_no,
                    "stored_at": s.stored_at,
                    "remark": s.remark,
                }
                for s in slots
            ],
        })

    return zones


async def get_statistics(db: AsyncSession) -> dict:
    """获取全局统计（1 条 SQL 聚合）"""
    result = await db.execute(
        select(
            func.count(StorageSlot.id).label("total"),
            func.count(case((StorageSlot.status != SlotStatus.EMPTY.value, 1))).label("used"),
            func.count(case((StorageSlot.status == SlotStatus.LOADED.value, 1))).label("heavy"),
            func.count(case((StorageSlot.status == SlotStatus.EMPTY_CONTAINER.value, 1))).label("empty_container"),
        )
    )
    row = result.one()

    total_slots = row.total
    used_slots = row.used
    heavy_count = row.heavy
    empty_container_count = row.empty_container
    available_slots = total_slots - used_slots
    utilization_rate = round(used_slots / total_slots, 4) if total_slots > 0 else 0.0

    return {
        "total_slots": total_slots,
        "used_slots": used_slots,
        "available_slots": available_slots,
        "heavy_count": heavy_count,
        "empty_container_count": empty_container_count,
        "utilization_rate": utilization_rate,
    }


async def _count_empty_slots(db: AsyncSession, zone_code: str) -> int:
    result = await db.execute(
        select(func.count(StorageSlot.id)).where(
            StorageSlot.zone_code == zone_code,
            StorageSlot.status == SlotStatus.EMPTY.value,
        )
    )
    return result.scalar() or 0


async def _find_empty_slots(
    db: AsyncSession, zone_code: str, limit: int
) -> list[StorageSlot]:
    result = await db.execute(
        select(StorageSlot)
        .where(
            StorageSlot.zone_code == zone_code,
            StorageSlot.status == SlotStatus.EMPTY.value,
        )
        .order_by(StorageSlot.row, StorageSlot.col)
        .limit(limit)
        .with_for_update()
    )
    return list(result.scalars().all())


def _fill_slot(slot: StorageSlot, item: dict) -> None:
    """填充库位数据"""
    slot.status = (
        SlotStatus.LOADED.value
        if item["container_status"] == "heavy"
        else SlotStatus.EMPTY_CONTAINER.value
    )
    slot.container_no = item["container_no"]
    slot.container_status = item["container_status"]
    slot.customer_name = item.get("customer_name")
    slot.container_type = item.get("container_type")
    slot.seal_no = item.get("seal_no")
    slot.stored_at = datetime.now(timezone.utc)


async def _check_container_uniqueness(db: AsyncSession, container_nos: list[str]) -> None:
    if not container_nos:
        return
    result = await db.execute(
        select(StorageSlot.container_no).where(
            StorageSlot.container_no.in_(container_nos),
            StorageSlot.container_no.isnot(None),
        )
    )
    existing = [row[0] for row in result.fetchall()]
    if existing:
        raise BusinessRuleViolationError(
            f"箱号已存在: {', '.join(existing)}"
        )


async def manual_inbound(
    db: AsyncSession, zone_code: str, items: list[dict]
) -> dict:
    """手动入库：校验容量 → 校验箱号唯一性 → 行优先分配空位 → fill → flush"""
    container_nos = [item["container_no"] for item in items]

    empty_count = await _count_empty_slots(db, zone_code)
    if empty_count < len(items):
        raise BusinessRuleViolationError(
            f"可用库位不足，当前可用 {empty_count} 个，需要 {len(items)} 个"
        )

    await _check_container_uniqueness(db, container_nos)

    empty_slots = await _find_empty_slots(db, zone_code, len(items))

    result_items = []
    for slot, item in zip(empty_slots, items):
        _fill_slot(slot, item)
        result_items.append({
            "slot_no": slot.slot_no,
            "container_no": item["container_no"],
        })

    await db.flush()

    return {
        "stored_count": len(result_items),
        "items": result_items,
    }


def _parse_excel(content: bytes) -> list[dict]:
    """解析 Excel 文件内容，返回行数据列表"""
    try:
        workbook = openpyxl.load_workbook(io.BytesIO(content), read_only=True)
    except Exception:
        raise ValidationException("文件解析失败，请检查文件格式")

    try:
        sheet = workbook.active
        rows = []
        header_skipped = False
        for row in sheet.iter_rows(values_only=True):
            if not header_skipped:
                header_skipped = True
                continue
            if not row or row[0] is None:
                continue
            rows.append({
                "container_no": row[0],
                "container_status": row[1] if len(row) > 1 else None,
                "customer_name": row[2] if len(row) > 2 else None,
                "container_type": row[3] if len(row) > 3 else None,
                "seal_no": row[4] if len(row) > 4 else None,
            })
        return rows
    finally:
        workbook.close()


async def import_inbound(
    db: AsyncSession, zone_code: str, content: bytes
) -> dict:
    """导入入库：解析 Excel → 校验行数据 → 复用 manual_inbound 逻辑"""
    rows = _parse_excel(content)

    valid_items: list[dict] = []
    errors: list[str] = []

    for i, row in enumerate(rows, start=2):
        container_no = str(row.get("container_no", "")).strip().upper()
        container_status = str(row.get("container_status", "")).strip().lower()

        if not re.match(r"^[A-Z]{4}\d{7}$", container_no):
            errors.append(f"第 {i} 行: 箱号格式错误 '{container_no}'")
            continue

        if container_status not in ("heavy", "empty"):
            errors.append(f"第 {i} 行: 箱状态必须为 heavy 或 empty")
            continue

        valid_items.append({
            "container_no": container_no,
            "container_status": container_status,
            "customer_name": str(row.get("customer_name", "")).strip() or None,
            "container_type": str(row.get("container_type", "")).strip() or None,
            "seal_no": str(row.get("seal_no", "")).strip() or None,
        })

    stored_count = 0
    result_items: list[dict] = []

    if valid_items:
        try:
            async with db.begin_nested():
                result = await manual_inbound(db, zone_code, valid_items)
                stored_count = result["stored_count"]
                result_items = result["items"]
        except BusinessRuleViolationError as e:
            errors.append(e.message)

    return {
        "total_rows": len(rows),
        "stored_count": stored_count,
        "errors": errors,
    }


def _clear_slot(slot: StorageSlot) -> dict:
    """清空库位，返回原有箱信息"""
    info = {
        "container_no": slot.container_no,
        "container_status": slot.container_status,
        "customer_name": slot.customer_name,
        "container_type": slot.container_type,
        "seal_no": slot.seal_no,
    }
    slot.status = SlotStatus.EMPTY.value
    slot.container_no = None
    slot.container_status = None
    slot.customer_name = None
    slot.container_type = None
    slot.seal_no = None
    slot.stored_at = None
    slot.remark = None
    return info


async def _get_slot_or_raise(
    db: AsyncSession, slot_id: str
) -> StorageSlot:
    result = await db.execute(
        select(StorageSlot).where(StorageSlot.id == slot_id).with_for_update()
    )
    slot = result.scalar_one_or_none()
    if not slot:
        raise BusinessRuleViolationError(f"库位不存在: {slot_id}")
    return slot


async def outbound(
    db: AsyncSession, slot_ids: list[str], business_type: str | None = None
) -> dict:
    """出库：锁行校验 → 创建调度任务 → 清空库位 → 统一 commit 由调用方执行"""
    from app.services.dispatch_service import create_order

    slots = []
    for sid in slot_ids:
        slot = await _get_slot_or_raise(db, sid)
        if slot.status == SlotStatus.EMPTY.value:
            raise BusinessRuleViolationError(f"库位 {slot.slot_no} 为空，无法出库")
        slots.append(slot)

    result_items = []
    for slot in slots:
        info = _clear_slot(slot)

        order_data = {
            "container_no": info["container_no"],
            "container_status": info["container_status"],
            "customer_name": info["customer_name"],
            "container_type": info["container_type"],
            "seal_no": info["seal_no"],
            "business_type": business_type,
        }

        order = await create_order(
            db,
            order_data,
            dispatcher_id=SYSTEM_USER_ID,
            skip_container_validation=True,
            auto_commit=False,
        )

        result_items.append({
            "slot_no": slot.slot_no,
            "container_no": info["container_no"],
            "order_no": order.order_no,
        })

    await db.flush()

    return {
        "outbound_count": len(result_items),
        "items": result_items,
    }


async def move_slot(
    db: AsyncSession, source_slot_id: str, target_slot_id: str
) -> dict:
    """移动库位：锁行 → 校验源非空且目标为空 → 复制字段到目标 → 清空源 → flush"""
    source = await _get_slot_or_raise(db, source_slot_id)
    target = await _get_slot_or_raise(db, target_slot_id)

    if source.status == SlotStatus.EMPTY.value:
        raise BusinessRuleViolationError("源库位为空，无法移动")
    if target.status != SlotStatus.EMPTY.value:
        raise BusinessRuleViolationError("目标库位非空，无法移入")

    # 先保存源数据，再清空源（避免 uq_container_no 唯一约束冲突）
    moved_data = {
        "status": source.status,
        "container_no": source.container_no,
        "container_status": source.container_status,
        "customer_name": source.customer_name,
        "container_type": source.container_type,
        "seal_no": source.seal_no,
        "stored_at": source.stored_at,
        "remark": source.remark,
    }

    _clear_slot(source)
    await db.flush()

    for key, value in moved_data.items():
        setattr(target, key, value)
    await db.flush()

    return {
        "source_slot_no": source.slot_no,
        "target_slot_no": target.slot_no,
    }


async def update_slot(
    db: AsyncSession, slot_id: str, data: dict
) -> dict:
    slot = await _get_slot_or_raise(db, slot_id)

    if slot.status == SlotStatus.EMPTY.value:
        raise BusinessRuleViolationError("空库位无法编辑")

    if "customer_name" in data:
        slot.customer_name = data["customer_name"]
    if "remark" in data:
        slot.remark = data["remark"]
    if "container_status" in data:
        slot.container_status = data["container_status"]
        if data["container_status"] == "heavy":
            slot.status = SlotStatus.LOADED.value
        else:
            slot.status = SlotStatus.EMPTY_CONTAINER.value

    await db.flush()

    return {
        "slot_no": slot.slot_no,
        "customer_name": slot.customer_name,
        "remark": slot.remark,
        "container_status": slot.container_status,
    }


async def _find_first_empty_slot(db: AsyncSession, zone_code: str) -> StorageSlot | None:
    """在指定区域内找第一个空位（行优先从左到右）"""
    result = await db.execute(
        select(StorageSlot)
        .where(
            StorageSlot.zone_code == zone_code,
            StorageSlot.status == SlotStatus.EMPTY.value,
        )
        .order_by(StorageSlot.row, StorageSlot.col)
        .limit(1)
        .with_for_update()
    )
    return result.scalar_one_or_none()


async def auto_store(db: AsyncSession, order: Order) -> StorageSlot | None:
    """自动入库：按优先级分配库位"""
    container_no = order.container_no
    if not container_no:
        return None

    # 校验箱号唯一性
    existing = await db.execute(
        select(StorageSlot).where(StorageSlot.container_no == container_no)
    )
    if existing.scalar_one_or_none():
        raise AppException(code=409, message=f"箱号 {container_no} 已存在")

    # 按优先级遍历区域
    for zone_code in AUTO_INBOUND_PRIORITY:
        slot = await _find_first_empty_slot(db, zone_code)
        if slot:
            _fill_slot(slot, {
                "container_no": container_no,
                "container_status": order.container_status or "heavy",
                "customer_name": order.customer_name,
                "container_type": order.container_type,
                "seal_no": order.seal_no,
            })
            await db.flush()
            return slot

    raise AppException(code=409, message="库位已满，无法自动入库")


async def search_slots(db: AsyncSession, keyword: str) -> dict:
    """搜索库位：按箱号或货主名称模糊匹配"""
    escaped = keyword.replace("%", "\\%").replace("_", "\\_")
    pattern = f"%{escaped}%"

    result = await db.execute(
        select(StorageSlot).where(
            StorageSlot.status != SlotStatus.EMPTY.value,
            (StorageSlot.container_no.ilike(pattern))
            | (StorageSlot.customer_name.ilike(pattern)),
        )
    )
    slots = result.scalars().all()

    items = []
    zone_counts: dict[str, int] = {}

    for slot in slots:
        matched_fields = []
        if slot.container_no and keyword.lower() in slot.container_no.lower():
            matched_fields.append("container_no")
        if slot.customer_name and keyword.lower() in slot.customer_name.lower():
            matched_fields.append("customer_name")

        items.append({
            "slot_id": str(slot.id),
            "zone_code": slot.zone_code,
            "slot_no": slot.slot_no,
            "container_no": slot.container_no,
            "customer_name": slot.customer_name,
            "matched_fields": matched_fields,
        })

        zone_counts[slot.zone_code] = zone_counts.get(slot.zone_code, 0) + 1

    return {
        "keyword": keyword,
        "total": len(items),
        "items": items,
        "zone_counts": zone_counts,
    }
