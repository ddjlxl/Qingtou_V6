"""remove origin_address and dest_address columns

Revision ID: f1a2b3c4d5e6
Revises: e5f6a7b8c9d0
Create Date: 2026-05-15 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, Sequence[str], None] = 'e5f6a7b8c9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column('orders', 'origin_address')
    op.drop_column('orders', 'dest_address')


def downgrade() -> None:
    op.add_column('orders', sa.Column('origin_address', sa.String(500), nullable=True))
    op.add_column('orders', sa.Column('dest_address', sa.String(500), nullable=True))
