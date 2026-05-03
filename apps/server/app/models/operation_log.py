import enum
import uuid
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy import DateTime, ForeignKey, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, validates

from app.models.base import Base


class OpType(str, enum.Enum):
    LOGIN = "login"
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    SYSTEM = "system"


class OperationLog(Base):
    """操作日志。

    继承 Base 而非 BaseModel，因为日志记录后不可修改，不需要 updated_at。
    """

    __tablename__ = "operation_logs"
    __table_args__ = (
        sa.Index("ix_oplogs_operator", "operator_id"),
        sa.Index("ix_oplogs_type", "op_type"),
        sa.Index("ix_oplogs_created", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    op_type: Mapped[str] = mapped_column(
        String(30), nullable=False
    )
    action: Mapped[str] = mapped_column(
        String(100), nullable=False
    )
    operator_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id"), nullable=False
    )
    operator_name: Mapped[str] = mapped_column(
        String(50), nullable=False
    )
    ip_address: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )
    detail: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    @validates("op_type")
    def validate_op_type(self, _: str, value: str) -> str:
        if value not in {o.value for o in OpType}:
            raise ValueError(f"Invalid operation type: {value}")
        return value
