import enum
import uuid
from datetime import date

import sqlalchemy as sa
from sqlalchemy import Date, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, validates

from app.models.base import BaseModel


class OwnerType(str, enum.Enum):
    VEHICLE = "vehicle"
    DRIVER = "driver"


class VehicleCertType(str, enum.Enum):
    COMPULSORY_INSURANCE = "compulsory_insurance"
    COMMERCIAL_INSURANCE = "commercial_insurance"
    ANNUAL_INSPECTION = "annual_inspection"
    ROAD_TRANSPORT = "road_transport"


class DriverCertType(str, enum.Enum):
    DRIVING_LICENSE = "driving_license"
    QUALIFICATION = "qualification"


class Certificate(BaseModel):
    __tablename__ = "certificates"
    __table_args__ = (
        sa.Index("ix_cert_owner", "owner_id", "owner_type"),
        sa.Index("ix_cert_expiry", "expiry_date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, nullable=False
    )
    owner_type: Mapped[str] = mapped_column(
        String(20), nullable=False
    )
    cert_type: Mapped[str] = mapped_column(
        String(30), nullable=False
    )
    cert_name: Mapped[str] = mapped_column(
        String(100), nullable=False
    )
    issue_date: Mapped[date] = mapped_column(
        Date, nullable=False
    )
    expiry_date: Mapped[date] = mapped_column(
        Date, nullable=False
    )
    attachment: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    remark: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )

    @validates("owner_type")
    def validate_owner_type(self, _: str, value: str) -> str:
        if value not in {o.value for o in OwnerType}:
            raise ValueError(f"Invalid owner type: {value}")
        return value

    @validates("cert_type")
    def validate_cert_type(self, _: str, value: str) -> str:
        vehicle_types = {c.value for c in VehicleCertType}
        driver_types = {c.value for c in DriverCertType}
        if value not in vehicle_types | driver_types:
            raise ValueError(f"Invalid certificate type: {value}")
        return value
