import uuid

import sqlalchemy as sa
from sqlalchemy import String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class BusinessTypeRoute(BaseModel):
    __tablename__ = "business_type_routes"
    __table_args__ = (
        sa.Index("ix_business_type_routes_type", "business_type", unique=True),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    business_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )
    origin_name: Mapped[str] = mapped_column(
        String(200), nullable=False
    )
    waypoints: Mapped[str | None] = mapped_column(Text, nullable=True)
    dest_name: Mapped[str] = mapped_column(
        String(200), nullable=False
    )