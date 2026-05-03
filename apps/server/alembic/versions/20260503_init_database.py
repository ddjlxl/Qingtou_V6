"""init database

Revision ID: 20260503_init
Revises:
Create Date: 2026-05-03 21:30:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260503_init"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. 创建无依赖的基础表
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid, nullable=False),
        sa.Column("username", sa.String(length=50), nullable=False),
        sa.Column("password", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("phone", sa.String(length=20), nullable=True),
        sa.Column("avatar", sa.String(length=255), nullable=True),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("last_login_at", sa.DateTime, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime,
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime,
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("username"),
    )
    op.create_table(
        "help_articles",
        sa.Column("id", sa.Uuid, nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("sort_order", sa.Integer, nullable=False),
        sa.Column("is_published", sa.Boolean, nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime,
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime,
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "system_configs",
        sa.Column("id", sa.Uuid, nullable=False),
        sa.Column("config_key", sa.String(length=100), nullable=False),
        sa.Column("config_value", sa.Text, nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime,
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime,
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("config_key"),
    )
    op.create_table(
        "warehouses",
        sa.Column("id", sa.Uuid, nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("customer_name", sa.String(length=100), nullable=False),
        sa.Column("total_slots", sa.Integer, nullable=False),
        sa.Column("remark", sa.Text, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime,
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime,
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )

    # 2. 创建依赖 users 的表
    op.create_table(
        "common_addresses",
        sa.Column("id", sa.Uuid, nullable=False),
        sa.Column("user_id", sa.Uuid, nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("address", sa.String(length=500), nullable=False),
        sa.Column("lat", sa.Numeric(precision=10, scale=8), nullable=True),
        sa.Column("lng", sa.Numeric(precision=11, scale=8), nullable=True),
        sa.Column("type", sa.String(length=20), nullable=False),
        sa.Column("sort_order", sa.Integer, nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime,
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime,
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "operation_logs",
        sa.Column("id", sa.Uuid, nullable=False),
        sa.Column("op_type", sa.String(length=30), nullable=False),
        sa.Column("action", sa.String(length=100), nullable=False),
        sa.Column("operator_id", sa.Uuid, nullable=False),
        sa.Column("operator_name", sa.String(length=50), nullable=False),
        sa.Column("ip_address", sa.String(length=50), nullable=True),
        sa.Column("detail", sa.Text, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime,
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["operator_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    # 3. 创建 drivers 和 vehicles（无循环外键）
    op.create_table(
        "drivers",
        sa.Column("id", sa.Uuid, nullable=False),
        sa.Column("user_id", sa.Uuid, nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("phone", sa.String(length=20), nullable=True),
        sa.Column("bound_vehicle_id", sa.Uuid, nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime,
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime,
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "vehicles",
        sa.Column("id", sa.Uuid, nullable=False),
        sa.Column("plate_no", sa.String(length=20), nullable=False),
        sa.Column("vehicle_type", sa.String(length=50), nullable=True),
        sa.Column("ownership", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("current_lat", sa.Numeric(precision=10, scale=8), nullable=True),
        sa.Column("current_lng", sa.Numeric(precision=11, scale=8), nullable=True),
        sa.Column("current_location", sa.String(length=200), nullable=True),
        sa.Column("total_mileage", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("today_mileage", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("month_mileage", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("remark", sa.Text, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime,
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime,
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("plate_no"),
    )

    # 4. 添加 drivers -> vehicles 外键（在 vehicles 创建后）
    op.create_foreign_key(
        "fk_drivers_vehicle",
        "drivers",
        "vehicles",
        ["bound_vehicle_id"],
        ["id"],
    )

    # 5. 创建依赖 warehouses 的表
    op.create_table(
        "storage_slots",
        sa.Column("id", sa.Uuid, nullable=False),
        sa.Column("warehouse_id", sa.Uuid, nullable=False),
        sa.Column("slot_no", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("container_no", sa.String(length=20), nullable=True),
        sa.Column("stored_at", sa.DateTime, nullable=True),
        sa.Column("remark", sa.Text, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime,
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime,
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["warehouse_id"], ["warehouses.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("warehouse_id", "slot_no", name="uq_slot_warehouse_no"),
    )

    # 6. 创建剩余表
    op.create_table(
        "certificates",
        sa.Column("id", sa.Uuid, nullable=False),
        sa.Column("owner_id", sa.Uuid, nullable=False),
        sa.Column("owner_type", sa.String(length=20), nullable=False),
        sa.Column("cert_type", sa.String(length=30), nullable=False),
        sa.Column("cert_name", sa.String(length=100), nullable=False),
        sa.Column("issue_date", sa.Date, nullable=False),
        sa.Column("expiry_date", sa.Date, nullable=False),
        sa.Column("attachment", sa.String(length=255), nullable=True),
        sa.Column("remark", sa.Text, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime,
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime,
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "orders",
        sa.Column("id", sa.Uuid, nullable=False),
        sa.Column("order_no", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("priority", sa.String(length=20), nullable=False),
        sa.Column("customer_name", sa.String(length=100), nullable=False),
        sa.Column("customer_phone", sa.String(length=20), nullable=True),
        sa.Column("origin_name", sa.String(length=200), nullable=False),
        sa.Column("origin_address", sa.String(length=500), nullable=False),
        sa.Column("dest_name", sa.String(length=200), nullable=False),
        sa.Column("dest_address", sa.String(length=500), nullable=False),
        sa.Column("container_no", sa.String(length=20), nullable=True),
        sa.Column("container_type", sa.String(length=10), nullable=True),
        sa.Column("seal_no", sa.String(length=20), nullable=True),
        sa.Column("driver_id", sa.Uuid, nullable=True),
        sa.Column("vehicle_id", sa.Uuid, nullable=True),
        sa.Column("dispatcher_id", sa.Uuid, nullable=False),
        sa.Column("remark", sa.Text, nullable=True),
        sa.Column("ocr_image", sa.String(length=255), nullable=True),
        sa.Column("assigned_at", sa.DateTime, nullable=True),
        sa.Column("started_at", sa.DateTime, nullable=True),
        sa.Column("completed_at", sa.DateTime, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime,
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime,
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["driver_id"], ["drivers.id"]),
        sa.ForeignKeyConstraint(["dispatcher_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["vehicle_id"], ["vehicles.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("order_no"),
    )

    # 7. 创建索引
    op.create_index("ix_users_role", "users", ["role"])
    op.create_index("ix_users_status", "users", ["status"])
    op.create_index("ix_orders_status", "orders", ["status"])
    op.create_index("ix_orders_driver", "orders", ["driver_id"])
    op.create_index("ix_orders_vehicle", "orders", ["vehicle_id"])
    op.create_index("ix_orders_dispatcher", "orders", ["dispatcher_id"])
    op.create_index("ix_orders_created", "orders", ["created_at"])
    op.create_index("ix_drivers_user", "drivers", ["user_id"])
    op.create_index("ix_drivers_vehicle", "drivers", ["bound_vehicle_id"])
    op.create_index("ix_drivers_status", "drivers", ["status"])
    op.create_index("ix_vehicles_status", "vehicles", ["status"])
    op.create_index("ix_cert_owner", "certificates", ["owner_id", "owner_type"])
    op.create_index("ix_cert_expiry", "certificates", ["expiry_date"])
    op.create_index("ix_addresses_user", "common_addresses", ["user_id"])
    op.create_index("ix_addresses_type", "common_addresses", ["type"])
    op.create_index("ix_oplogs_operator", "operation_logs", ["operator_id"])
    op.create_index("ix_oplogs_type", "operation_logs", ["op_type"])
    op.create_index("ix_oplogs_created", "operation_logs", ["created_at"])
    op.create_index("ix_help_category", "help_articles", ["category"])
    op.create_index("ix_slots_warehouse", "storage_slots", ["warehouse_id"])
    op.create_index("ix_slots_status", "storage_slots", ["status"])


def downgrade() -> None:
    op.drop_index("ix_slots_status", table_name="storage_slots")
    op.drop_index("ix_slots_warehouse", table_name="storage_slots")
    op.drop_index("ix_help_category", table_name="help_articles")
    op.drop_index("ix_oplogs_created", table_name="operation_logs")
    op.drop_index("ix_oplogs_type", table_name="operation_logs")
    op.drop_index("ix_oplogs_operator", table_name="operation_logs")
    op.drop_index("ix_addresses_type", table_name="common_addresses")
    op.drop_index("ix_addresses_user", table_name="common_addresses")
    op.drop_index("ix_cert_expiry", table_name="certificates")
    op.drop_index("ix_cert_owner", table_name="certificates")
    op.drop_index("ix_vehicles_status", table_name="vehicles")
    op.drop_index("ix_drivers_status", table_name="drivers")
    op.drop_index("ix_drivers_vehicle", table_name="drivers")
    op.drop_index("ix_drivers_user", table_name="drivers")
    op.drop_index("ix_orders_created", table_name="orders")
    op.drop_index("ix_orders_dispatcher", table_name="orders")
    op.drop_index("ix_orders_vehicle", table_name="orders")
    op.drop_index("ix_orders_driver", table_name="orders")
    op.drop_index("ix_orders_status", table_name="orders")
    op.drop_index("ix_users_status", table_name="users")
    op.drop_index("ix_users_role", table_name="users")
    op.drop_table("orders")
    op.drop_table("certificates")
    op.drop_table("storage_slots")
    op.drop_constraint("fk_drivers_vehicle", "drivers", type_="foreignkey")
    op.drop_table("vehicles")
    op.drop_table("drivers")
    op.drop_table("operation_logs")
    op.drop_table("common_addresses")
    op.drop_table("warehouses")
    op.drop_table("system_configs")
    op.drop_table("help_articles")
    op.drop_table("users")
