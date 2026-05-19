"""add_container_status

Revision ID: c2dad547e764
Revises: a2b3c4d5e6f7
Create Date: 2026-05-20 06:03:06.039300

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'c2dad547e764'
down_revision: Union[str, Sequence[str], None] = 'a2b3c4d5e6f7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('orders', sa.Column('container_status', sa.String(length=10), nullable=True))
    op.add_column('transport_records', sa.Column('container_status', sa.String(length=10), nullable=True))


def downgrade() -> None:
    op.drop_column('transport_records', 'container_status')
    op.drop_column('orders', 'container_status')
