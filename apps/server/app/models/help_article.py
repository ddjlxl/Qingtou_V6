import uuid

import sqlalchemy as sa
from sqlalchemy import Boolean, Integer, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class HelpArticle(BaseModel):
    __tablename__ = "help_articles"
    __table_args__ = (
        sa.Index("ix_help_category", "category"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )
    title: Mapped[str] = mapped_column(
        String(200), nullable=False
    )
    category: Mapped[str] = mapped_column(
        String(50), nullable=False
    )
    content: Mapped[str] = mapped_column(
        Text, nullable=False
    )
    sort_order: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )
    is_published: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True
    )
