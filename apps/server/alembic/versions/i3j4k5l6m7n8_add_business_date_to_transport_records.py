"""add business_date to transport_records

Revision ID: i3j4k5l6m7n8
Revises: h1i2j3k4l5m6
Create Date: 2026-05-22 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'i3j4k5l6m7n8'
down_revision: Union[str, Sequence[str], None] = 'h1i2j3k4l5m6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'transport_records',
        sa.Column('business_date', sa.Date(), nullable=True, comment='业务发生日期，用于按时间筛选'),
    )
    op.create_index(
        'ix_transport_records_business_date',
        'transport_records',
        ['business_date'],
    )
    # 回填：将已有记录的 imported_at 日期部分写入 business_date
    op.execute(
        "UPDATE transport_records SET business_date = imported_at::date WHERE business_date IS NULL"
    )


def downgrade() -> None:
    op.drop_index('ix_transport_records_business_date', table_name='transport_records')
    op.drop_column('transport_records', 'business_date')
