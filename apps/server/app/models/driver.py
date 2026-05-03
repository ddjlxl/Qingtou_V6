import enum
import uuid

import sqlalchemy as sa
from sqlalchemy import ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, validates

from app.models.base import BaseModel


class DriverStatus(str, enum.Enum):
    IDLE = "idle"
    TRANSITING = "transiting"
    REST = "rest"


class Driver(BaseModel):
    __tablename__ = "drivers"
    __table_args__ = (
        sa.Index("ix_drivers_user", "user_id"),
        sa.Index("ix_drivers_vehicle", "bound_vehicle_id"),
        sa.Index("ix_drivers_status", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    bound_vehicle_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("vehicles.id"), nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=DriverStatus.IDLE.value
    )

    @validates("status")
    def validate_status(self, _: str, value: str) -> str:
        if value not in {s.value for s in DriverStatus}:
            raise ValueError(f"Invalid driver status: {value}")
        return value
