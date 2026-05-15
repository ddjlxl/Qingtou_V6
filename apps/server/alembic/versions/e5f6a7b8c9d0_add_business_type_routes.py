"""add business_type_routes table

Revision ID: e5f6a7b8c9d0
Revises: d43be0594dab
Create Date: 2026-05-15 10:00:00.000000

"""
import uuid
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, Sequence[str], None] = 'd43be0594dab'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('business_type_routes',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('business_type', sa.String(50), nullable=False),
        sa.Column('origin_name', sa.String(200), nullable=False),
        sa.Column('waypoints', sa.Text(), nullable=True),
        sa.Column('dest_name', sa.String(200), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_business_type_routes_type', 'business_type_routes', ['business_type'], unique=True)

    op.execute(
        "INSERT INTO business_type_routes (id, business_type, origin_name, waypoints, dest_name) VALUES "
        f"('{uuid.uuid4()}', 'heavy_transport', '上海港', '[\"苏州物流园\"]', '昆山工厂'), "
        f"('{uuid.uuid4()}', 'empty_transport', '宁波港', NULL, '杭州仓库'), "
        f"('{uuid.uuid4()}', 'short_haul', '太仓港', '[\"常熟中转站\"]', '张家港工厂')"
    )


def downgrade() -> None:
    op.drop_index('ix_business_type_routes_type', table_name='business_type_routes')
    op.drop_table('business_type_routes')