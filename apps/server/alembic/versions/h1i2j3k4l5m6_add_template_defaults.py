"""add documents and container_status to business_type_routes

Revision ID: h1i2j3k4l5m6
Revises: a2b3c4d5e6f7
Create Date: 2026-05-20 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'h1i2j3k4l5m6'
down_revision: Union[str, Sequence[str], None] = 'c2dad547e764'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'business_type_routes',
        sa.Column('documents', sa.Text(), nullable=True)
    )
    op.add_column(
        'business_type_routes',
        sa.Column('container_status', sa.String(20), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('business_type_routes', 'container_status')
    op.drop_column('business_type_routes', 'documents')
