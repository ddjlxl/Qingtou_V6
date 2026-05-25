import enum
import uuid
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy import DateTime, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, validates

from app.models.base import BaseModel


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    DISPATCHER = "dispatcher"
    DRIVER = "driver"
    WAREHOUSE_KEEPER = "warehouse_keeper"


class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    DISABLED = "disabled"


class User(BaseModel):
    __tablename__ = "users"
    __table_args__ = (
        sa.Index("ix_users_role", "role"),
        sa.Index("ix_users_status", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    username: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False
    )
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    avatar: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[str] = mapped_column(
        String(20), nullable=False, default=UserRole.DISPATCHER.value
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=UserStatus.ACTIVE.value
    )
    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    @validates("role")
    def validate_role(self, _: str, value: str) -> str:
        if value not in {r.value for r in UserRole}:
            raise ValueError(f"Invalid role: {value}")
        return value

    @validates("status")
    def validate_status(self, _: str, value: str) -> str:
        if value not in {s.value for s in UserStatus}:
            raise ValueError(f"Invalid status: {value}")
        return value
