"""v1_3_warehouse_storage_slot_refactor

Revision ID: k5l6m7n8o9p0
Revises: j4k5l6m7n8o9
Create Date: 2026-05-25 00:00:00.000000

"""
import uuid
from datetime import datetime, timezone
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'k5l6m7n8o9p0'
down_revision: Union[str, Sequence[str], None] = 'j4k5l6m7n8o9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000001"

ZONES = [
    (1,  "3-5",  "3-5 区"),
    (2,  "3-7",  "3-7 区"),
    (3,  "3-20", "3-20 区"),
    (4,  "2-13", "2-13 区"),
    (5,  "1-1",  "1-1 区"),
    (6,  "1-20", "1-20 区"),
    (7,  "6-1",  "6-1 区"),
    (8,  "6-2",  "6-2 区"),
    (9,  "6-3",  "6-3 区"),
    (10, "6-4",  "6-4 区"),
    (11, "6-5",  "6-5 区"),
    (12, "6-6",  "6-6 区"),
]


def upgrade() -> None:
    # --- StorageSlot: 先删除旧的外键约束和索引 ---
    op.drop_index('ix_slots_status', table_name='storage_slots')
    op.drop_index('ix_slots_warehouse', table_name='storage_slots')
    op.drop_constraint('uq_slot_warehouse_no', 'storage_slots', type_='unique')
    op.drop_constraint('storage_slots_warehouse_id_fkey', 'storage_slots', type_='foreignkey')

    # --- StorageSlot: 新增字段 ---
    op.add_column('storage_slots', sa.Column('zone_code', sa.String(20), nullable=False, server_default=''))
    op.add_column('storage_slots', sa.Column('row', sa.Integer(), nullable=False, server_default='1'))
    op.add_column('storage_slots', sa.Column('col', sa.Integer(), nullable=False, server_default='1'))
    op.add_column('storage_slots', sa.Column('container_status', sa.String(10), nullable=True))
    op.add_column('storage_slots', sa.Column('customer_name', sa.String(100), nullable=True))
    op.add_column('storage_slots', sa.Column('container_type', sa.String(10), nullable=True))
    op.add_column('storage_slots', sa.Column('seal_no', sa.String(20), nullable=True))

    # --- Warehouse: 删除旧列和索引，新增列 ---
    op.drop_index('ix_warehouses_sort_order', table_name='warehouses') if _index_exists('ix_warehouses_sort_order') else None
    op.drop_constraint('warehouses_code_key', 'warehouses', type_='unique') if _constraint_exists('warehouses_code_key') else None
    op.drop_column('warehouses', 'code')
    op.drop_column('warehouses', 'customer_name')
    op.drop_column('warehouses', 'total_slots')
    op.add_column('warehouses', sa.Column('zone_code', sa.String(20), nullable=False, server_default=''))
    op.add_column('warehouses', sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'))

    # --- Warehouse: 新增索引 ---
    op.create_index('ix_warehouses_zone_code', 'warehouses', ['zone_code'], unique=False)
    op.create_index('ix_warehouses_sort_order', 'warehouses', ['sort_order'], unique=False)
    op.create_unique_constraint('warehouses_zone_code_key', 'warehouses', ['zone_code'])

    # --- StorageSlot: 恢复外键和约束 ---
    op.create_foreign_key('storage_slots_warehouse_id_fkey', 'storage_slots', 'warehouses', ['warehouse_id'], ['id'], ondelete='CASCADE')
    op.create_unique_constraint('uq_slot_warehouse_no', 'storage_slots', ['warehouse_id', 'slot_no'])
    op.create_index('ix_slots_warehouse', 'storage_slots', ['warehouse_id'])
    op.create_index('ix_slots_status', 'storage_slots', ['status'])
    op.create_index('ix_slots_zone_code', 'storage_slots', ['zone_code'])
    op.create_index('ix_slots_customer_name', 'storage_slots', ['customer_name'])
    op.create_index(
        'uq_container_no', 'storage_slots', ['container_no'],
        unique=True,
        postgresql_where=sa.text('container_no IS NOT NULL'),
    )
    op.create_index(
        'ix_slots_container_no', 'storage_slots', ['container_no'],
        postgresql_where=sa.text('container_no IS NOT NULL'),
    )

    # --- 删除旧数据（warehouses 表可能有旧数据） ---
    op.execute("DELETE FROM storage_slots")
    op.execute("DELETE FROM warehouses")

    # --- Seed: 创建系统用户 ---
    now = datetime.now(timezone.utc).isoformat()
    op.execute(f"""
        INSERT INTO users (id, username, password, name, role, status, created_at, updated_at)
        VALUES (
            '{SYSTEM_USER_ID}',
            'system',
            '$2b$12$invalid_hash_placeholder_no_login_possible_00000000000000000000000000',
            '系统',
            'admin',
            'disabled',
            '{now}',
            '{now}'
        )
    """)

    # --- Seed: 写入 12 个 Warehouse 记录 ---
    for sort_order, zone_code, name in ZONES:
        wh_id = str(uuid.uuid4())
        op.execute(f"""
            INSERT INTO warehouses (id, name, zone_code, sort_order, created_at, updated_at)
            VALUES ('{wh_id}', '{name}', '{zone_code}', {sort_order}, '{now}', '{now}')
        """)

    # --- Seed: 写入 144 个 StorageSlot 记录 ---
    conn = op.get_bind()
    result = conn.execute(sa.text("SELECT id, zone_code FROM warehouses ORDER BY sort_order"))
    warehouse_map = {row[1]: row[0] for row in result}

    for _sort_order, zone_code, _name in ZONES:
        warehouse_id = str(warehouse_map[zone_code])
        for row in range(1, 4):
            for col in range(1, 5):
                slot_no = f"{zone_code}-{row}-{col}"
                slot_id = str(uuid.uuid4())
                op.execute(f"""
                    INSERT INTO storage_slots
                        (id, warehouse_id, zone_code, slot_no, row, col, status, created_at, updated_at)
                    VALUES (
                        '{slot_id}', '{warehouse_id}', '{zone_code}', '{slot_no}',
                        {row}, {col}, 'empty',
                        '{now}', '{now}'
                    )
                """)


def downgrade() -> None:
    # --- 删除 seed data ---
    op.execute("DELETE FROM storage_slots")
    op.execute("DELETE FROM warehouses")
    op.execute(f"DELETE FROM users WHERE id = '{SYSTEM_USER_ID}'")

    # --- StorageSlot: 删除新索引和约束 ---
    op.drop_index('ix_slots_container_no', table_name='storage_slots')
    op.drop_index('uq_container_no', table_name='storage_slots')
    op.drop_index('ix_slots_customer_name', table_name='storage_slots')
    op.drop_index('ix_slots_zone_code', table_name='storage_slots')
    op.drop_index('ix_slots_status', table_name='storage_slots')
    op.drop_index('ix_slots_warehouse', table_name='storage_slots')
    op.drop_constraint('uq_slot_warehouse_no', 'storage_slots', type_='unique')
    op.drop_constraint('storage_slots_warehouse_id_fkey', 'storage_slots', type_='foreignkey')

    # --- StorageSlot: 删除新增字段 ---
    op.drop_column('storage_slots', 'seal_no')
    op.drop_column('storage_slots', 'container_type')
    op.drop_column('storage_slots', 'customer_name')
    op.drop_column('storage_slots', 'container_status')
    op.drop_column('storage_slots', 'col')
    op.drop_column('storage_slots', 'row')
    op.drop_column('storage_slots', 'zone_code')

    # --- StorageSlot: 恢复旧约束和索引 ---
    op.create_foreign_key('storage_slots_warehouse_id_fkey', 'storage_slots', 'warehouses', ['warehouse_id'], ['id'], ondelete='CASCADE')
    op.create_unique_constraint('uq_slot_warehouse_no', 'storage_slots', ['warehouse_id', 'slot_no'])
    op.create_index('ix_slots_warehouse', 'storage_slots', ['warehouse_id'])
    op.create_index('ix_slots_status', 'storage_slots', ['status'])

    # --- Warehouse: 删除新列和索引 ---
    op.drop_index('ix_warehouses_sort_order', table_name='warehouses')
    op.drop_index('ix_warehouses_zone_code', table_name='warehouses')
    op.drop_constraint('warehouses_zone_code_key', 'warehouses', type_='unique')
    op.drop_column('warehouses', 'sort_order')
    op.drop_column('warehouses', 'zone_code')

    # --- Warehouse: 恢复旧列 ---
    op.add_column('warehouses', sa.Column('code', sa.String(50), nullable=False, server_default=''))
    op.add_column('warehouses', sa.Column('customer_name', sa.String(100), nullable=False, server_default=''))
    op.add_column('warehouses', sa.Column('total_slots', sa.Integer(), nullable=False, server_default='0'))
    op.create_unique_constraint('warehouses_code_key', 'warehouses', ['code'])


def _index_exists(index_name: str) -> bool:
    """检查索引是否存在（用于条件性删除）"""
    conn = op.get_bind()
    result = conn.execute(
        sa.text("SELECT 1 FROM pg_indexes WHERE indexname = :name"),
        {"name": index_name},
    )
    return result.fetchone() is not None


def _constraint_exists(constraint_name: str) -> bool:
    """检查约束是否存在（用于条件性删除）"""
    conn = op.get_bind()
    result = conn.execute(
        sa.text("SELECT 1 FROM pg_constraint WHERE conname = :name"),
        {"name": constraint_name},
    )
    return result.fetchone() is not None
