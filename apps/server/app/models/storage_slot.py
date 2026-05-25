import enum
import uuid
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, validates

from app.models.base import BaseModel


class SlotStatus(str, enum.Enum):
    EMPTY = "empty"
    LOADED = "loaded"
    EMPTY_CONTAINER = "empty_container"


class ContainerStatus(str, enum.Enum):
    HEAVY = "heavy"
    EMPTY = "empty"


class ContainerType(str, enum.Enum):
    GP20 = "20GP"
    GP40 = "40GP"
    HQ40 = "40HQ"
    HQ45 = "45HQ"


class StorageSlot(BaseModel):
    __tablename__ = "storage_slots"
    __table_args__ = (
        sa.UniqueConstraint(
            "warehouse_id", "slot_no", name="uq_slot_warehouse_no"
        ),
        sa.Index("ix_slots_warehouse", "warehouse_id"),
        sa.Index("ix_slots_status", "status"),
        sa.Index("ix_slots_zone_code", "zone_code"),
        sa.Index("ix_slots_customer_name", "customer_name"),
        sa.Index(
            "uq_container_no", "container_no",
            unique=True,
            postgresql_where=sa.text("container_no IS NOT NULL"),
        ),
        sa.Index(
            "ix_slots_container_no", "container_no",
            postgresql_where=sa.text("container_no IS NOT NULL"),
        ),
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
    zone_code: Mapped[str] = mapped_column(String(20), nullable=False)
    slot_no: Mapped[str] = mapped_column(String(20), nullable=False)
    row: Mapped[int] = mapped_column(Integer, nullable=False)
    col: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=SlotStatus.EMPTY.value
    )
    container_no: Mapped[str | None] = mapped_column(
        String(20), nullable=True
    )
    container_status: Mapped[str | None] = mapped_column(
        String(10), nullable=True
    )
    customer_name: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )
    container_type: Mapped[str | None] = mapped_column(
        String(10), nullable=True
    )
    seal_no: Mapped[str | None] = mapped_column(
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

    @validates("container_status")
    def validate_container_status(self, _: str, value: str | None) -> str | None:
        if value is not None and value not in {c.value for c in ContainerStatus}:
            raise ValueError(f"Invalid container status: {value}")
        return value

    @validates("container_type")
    def validate_container_type(self, _: str, value: str | None) -> str | None:
        if value is not None and value not in {c.value for c in ContainerType}:
            raise ValueError(f"Invalid container type: {value}")
        return value
