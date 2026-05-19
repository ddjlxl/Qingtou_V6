import uuid
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy import DateTime, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class TransportRecord(BaseModel):
    __tablename__ = "transport_records"
    __table_args__ = (
        sa.Index("ix_transport_records_imported_at", "imported_at"),
        sa.Index("ix_transport_records_vehicle", "vehicle_id"),
        sa.Index("ix_transport_records_driver", "driver_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    order_no: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False
    )
    customer_info: Mapped[str] = mapped_column(
        String(200), nullable=False
    )
    container_status: Mapped[str | None] = mapped_column(
        String(10), nullable=True
    )
    origin: Mapped[str] = mapped_column(
        String(200), nullable=False
    )
    destination: Mapped[str] = mapped_column(
        String(200), nullable=False
    )
    container_no: Mapped[str] = mapped_column(
        String(20), nullable=False
    )
    vehicle_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("vehicles.id"), nullable=False
    )
    driver_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("drivers.id"), nullable=False
    )
    imported_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.now
    )