import enum
import uuid
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy import DateTime, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates

from app.models.base import BaseModel


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    TRANSITING = "transiting"
    COMPLETED = "completed"
    OVERDUE = "overdue"


class Priority(str, enum.Enum):
    NORMAL = "normal"
    URGENT = "urgent"


class BusinessType(str, enum.Enum):
    HEAVY_TRANSPORT = "heavy_transport"
    EMPTY_TRANSPORT = "empty_transport"
    SHORT_HAUL = "short_haul"


class DocumentType(str, enum.Enum):
    PICKUP_ORDER = "pickup_order"
    WEIGHING = "weighing"
    RECTIFICATION = "rectification"


class ContainerStatus(str, enum.Enum):
    HEAVY = "heavy"
    EMPTY = "empty"


class ContainerType(str, enum.Enum):
    GP20 = "20GP"
    GP40 = "40GP"
    HQ40 = "40HQ"
    HQ45 = "45HQ"


class Order(BaseModel):
    __tablename__ = "orders"
    __table_args__ = (
        sa.Index("ix_orders_status", "status"),
        sa.Index("ix_orders_driver", "driver_id"),
        sa.Index("ix_orders_vehicle", "vehicle_id"),
        sa.Index("ix_orders_dispatcher", "dispatcher_id"),
        sa.Index("ix_orders_created", "created_at"),
        sa.Index("ix_orders_assigned", "assigned_at"),
        sa.Index("ix_orders_business_type", "business_type"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    order_no: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=OrderStatus.PENDING.value
    )
    priority: Mapped[str] = mapped_column(
        String(20), nullable=False, default=Priority.NORMAL.value
    )
    customer_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    customer_phone: Mapped[str | None] = mapped_column(
        String(20), nullable=True
    )
    origin_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    dest_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    container_no: Mapped[str | None] = mapped_column(
        String(20), nullable=True
    )
    container_type: Mapped[str | None] = mapped_column(
        String(10), nullable=True
    )
    seal_no: Mapped[str | None] = mapped_column(String(20), nullable=True)
    waypoints: Mapped[str | None] = mapped_column(Text, nullable=True)
    business_type: Mapped[str | None] = mapped_column(String(20), nullable=True)
    container_status: Mapped[str | None] = mapped_column(
        String(10), nullable=True
    )
    documents: Mapped[str | None] = mapped_column(Text, nullable=True)
    driver_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("drivers.id"), nullable=True
    )
    vehicle_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("vehicles.id"), nullable=True
    )
    dispatcher_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=False
    )
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    ocr_image: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    assigned_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    driver: Mapped["Driver | None"] = relationship(
        "Driver", foreign_keys=[driver_id], lazy="selectin"
    )
    vehicle: Mapped["Vehicle | None"] = relationship(
        "Vehicle", foreign_keys=[vehicle_id], lazy="selectin"
    )
    dispatcher: Mapped["User"] = relationship(
        "User", foreign_keys=[dispatcher_id], lazy="selectin"
    )

    @validates("status")
    def validate_status(self, _: str, value: str) -> str:
        if value not in {s.value for s in OrderStatus}:
            raise ValueError(f"Invalid order status: {value}")
        return value

    @validates("priority")
    def validate_priority(self, _: str, value: str) -> str:
        if value not in {p.value for p in Priority}:
            raise ValueError(f"Invalid priority: {value}")
        return value

    @validates("container_type")
    def validate_container_type(self, _: str, value: str | None) -> str | None:
        if value is not None and value not in {c.value for c in ContainerType}:
            raise ValueError(f"Invalid container type: {value}")
        return value

    @validates("business_type")
    def validate_business_type(self, _: str, value: str | None) -> str | None:
        if value is not None and value not in {b.value for b in BusinessType}:
            raise ValueError(f"Invalid business type: {value}")
        return value

    @validates("container_status")
    def validate_container_status(self, _: str, value: str | None) -> str | None:
        if value is not None and value not in {c.value for c in ContainerStatus}:
            raise ValueError(f"Invalid container status: {value}")
        return value
