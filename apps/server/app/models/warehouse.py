import uuid

from sqlalchemy import Integer, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class Warehouse(BaseModel):
    __tablename__ = "warehouses"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False
    )
    customer_name: Mapped[str] = mapped_column(
        String(100), nullable=False
    )
    total_slots: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
