import uuid

import sqlalchemy as sa
from sqlalchemy import Integer, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class Warehouse(BaseModel):
    __tablename__ = "warehouses"
    __table_args__ = (
        sa.Index("ix_warehouses_zone_code", "zone_code"),
        sa.Index("ix_warehouses_sort_order", "sort_order"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    zone_code: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False
    )
    sort_order: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
