import enum
import uuid
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy import DateTime, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, validates

from app.models.base import BaseModel


class SlotStatus(str, enum.Enum):
    EMPTY = "empty"
    LOADED = "loaded"
    EMPTY_CONTAINER = "empty_container"


class StorageSlot(BaseModel):
    __tablename__ = "storage_slots"
    __table_args__ = (
        sa.UniqueConstraint(
            "warehouse_id", "slot_no", name="uq_slot_warehouse_no"
        ),
        sa.Index("ix_slots_warehouse", "warehouse_id"),
        sa.Index("ix_slots_status", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    warehouse_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("warehouses.id", ondelete="CASCADE"),
        nullable=False,
    )
    slot_no: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=SlotStatus.EMPTY.value
    )
    container_no: Mapped[str | None] = mapped_column(
        String(20), nullable=True
    )
    stored_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)

    @validates("status")
    def validate_status(self, _: str, value: str) -> str:
        if value not in {s.value for s in SlotStatus}:
            raise ValueError(f"Invalid slot status: {value}")
        return value
