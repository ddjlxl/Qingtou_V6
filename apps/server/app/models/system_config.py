import uuid

from sqlalchemy import String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class SystemConfig(BaseModel):
    __tablename__ = "system_configs"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    config_key: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False
    )
    config_value: Mapped[str] = mapped_column(
        Text, nullable=False
    )
    description: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
