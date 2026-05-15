"""add dispatch fields and dispatch_addresses table

Revision ID: a1b2c3d4e5f6
Revises: f7a7dd3e9194
Create Date: 2026-05-14 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'f7a7dd3e9194'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('orders', schema=None) as batch_op:
        batch_op.alter_column('customer_name', existing_type=sa.String(100), nullable=True)
        batch_op.alter_column('origin_name', existing_type=sa.String(200), nullable=True)
        batch_op.alter_column('origin_address', existing_type=sa.String(500), nullable=True)
        batch_op.alter_column('dest_name', existing_type=sa.String(200), nullable=True)
        batch_op.alter_column('dest_address', existing_type=sa.String(500), nullable=True)
        batch_op.add_column(sa.Column('waypoints', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('business_type', sa.String(20), nullable=True))
        batch_op.add_column(sa.Column('documents', sa.Text(), nullable=True))

    op.create_index('ix_orders_business_type', 'orders', ['business_type'], unique=False)
    op.create_index('ix_orders_assigned', 'orders', ['assigned_at'], unique=False)

    op.create_table('dispatch_addresses',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_dispatch_addresses_user', 'dispatch_addresses', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_dispatch_addresses_user', table_name='dispatch_addresses')
    op.drop_table('dispatch_addresses')

    op.drop_index('ix_orders_assigned', table_name='orders')
    op.drop_index('ix_orders_business_type', table_name='orders')

    with op.batch_alter_table('orders', schema=None) as batch_op:
        batch_op.drop_column('documents')
        batch_op.drop_column('business_type')
        batch_op.drop_column('waypoints')
        batch_op.alter_column('dest_address', existing_type=sa.String(500), nullable=False)
        batch_op.alter_column('dest_name', existing_type=sa.String(200), nullable=False)
        batch_op.alter_column('origin_address', existing_type=sa.String(500), nullable=False)
        batch_op.alter_column('origin_name', existing_type=sa.String(200), nullable=False)
        batch_op.alter_column('customer_name', existing_type=sa.String(100), nullable=False)
