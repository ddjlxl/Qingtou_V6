"""fix_order_nullable_columns

Revision ID: d43be0594dab
Revises: a1b2c3d4e5f6
Create Date: 2026-05-15 06:44:09.331505

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd43be0594dab'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('orders', recreate='always') as batch_op:
        batch_op.alter_column('customer_name', existing_type=sa.String(100), nullable=True)
        batch_op.alter_column('origin_name', existing_type=sa.String(200), nullable=True)
        batch_op.alter_column('origin_address', existing_type=sa.String(500), nullable=True)
        batch_op.alter_column('dest_name', existing_type=sa.String(200), nullable=True)
        batch_op.alter_column('dest_address', existing_type=sa.String(500), nullable=True)


def downgrade() -> None:
    with op.batch_alter_table('orders', recreate='always') as batch_op:
        batch_op.alter_column('customer_name', existing_type=sa.String(100), nullable=False)
        batch_op.alter_column('origin_name', existing_type=sa.String(200), nullable=False)
        batch_op.alter_column('origin_address', existing_type=sa.String(500), nullable=False)
        batch_op.alter_column('dest_name', existing_type=sa.String(200), nullable=False)
        batch_op.alter_column('dest_address', existing_type=sa.String(500), nullable=False)
