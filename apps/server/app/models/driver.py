import uuid

import sqlalchemy as sa
from sqlalchemy import String, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class Driver(BaseModel):
    __tablename__ = "drivers"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    is_disabled: Mapped[bool] = mapped_column(
        sa.Boolean, nullable=False, default=False
    )