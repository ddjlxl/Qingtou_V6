import enum
import uuid

import sqlalchemy as sa
from sqlalchemy import Numeric, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, validates

from app.models.base import BaseModel


class Ownership(str, enum.Enum):
    OWN = "own"
    EXTERNAL = "external"


class VehicleStatus(str, enum.Enum):
    IDLE = "idle"
    TRANSITING = "transiting"
    OVERDUE = "overdue"


class Vehicle(BaseModel):
    __tablename__ = "vehicles"
    __table_args__ = (
        sa.Index("ix_vehicles_status", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    plate_no: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False
    )
    vehicle_type: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )
    ownership: Mapped[str] = mapped_column(
        String(20), nullable=False, default=Ownership.OWN.value
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=VehicleStatus.IDLE.value
    )
    current_lat: Mapped[float | None] = mapped_column(
        Numeric(10, 8), nullable=True
    )
    current_lng: Mapped[float | None] = mapped_column(
        Numeric(11, 8), nullable=True
    )
    current_location: Mapped[str | None] = mapped_column(
        String(200), nullable=True
    )
    total_mileage: Mapped[float] = mapped_column(
        Numeric(10, 2), nullable=False, default=0
    )
    today_mileage: Mapped[float] = mapped_column(
        Numeric(10, 2), nullable=False, default=0
    )
    month_mileage: Mapped[float] = mapped_column(
        Numeric(10, 2), nullable=False, default=0
    )
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)

    @validates("ownership")
    def validate_ownership(self, _: str, value: str) -> str:
        if value not in {o.value for o in Ownership}:
            raise ValueError(f"Invalid ownership: {value}")
        return value

    @validates("status")
    def validate_status(self, _: str, value: str) -> str:
        if value not in {s.value for s in VehicleStatus}:
            raise ValueError(f"Invalid vehicle status: {value}")
        return value
