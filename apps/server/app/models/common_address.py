import enum
import uuid

import sqlalchemy as sa
from sqlalchemy import ForeignKey, Integer, Numeric, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, validates

from app.models.base import BaseModel


class AddressType(str, enum.Enum):
    PORT = "port"
    WAREHOUSE = "warehouse"
    YARD = "yard"
    FACTORY = "factory"
    OTHER = "other"


class CommonAddress(BaseModel):
    __tablename__ = "common_addresses"
    __table_args__ = (
        sa.Index("ix_addresses_user", "user_id"),
        sa.Index("ix_addresses_type", "type"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    address: Mapped[str] = mapped_column(String(500), nullable=False)
    lat: Mapped[float | None] = mapped_column(
        Numeric(10, 8), nullable=True
    )
    lng: Mapped[float | None] = mapped_column(
        Numeric(11, 8), nullable=True
    )
    type: Mapped[str] = mapped_column(
        String(20), nullable=False, default=AddressType.OTHER.value
    )
    sort_order: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )

    @validates("type")
    def validate_type(self, _: str, value: str) -> str:
        if value not in {t.value for t in AddressType}:
            raise ValueError(f"Invalid address type: {value}")
        return value
