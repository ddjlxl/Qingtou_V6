"""allow null origin_name and dest_name in business_type_routes

Revision ID: a2b3c4d5e6f7
Revises: f1a2b3c4d5e6
Create Date: 2026-05-16 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a2b3c4d5e6f7'
down_revision: Union[str, Sequence[str], None] = 'g2h3i4j5k6l7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE business_type_routes_new (
            id UUID NOT NULL,
            business_type VARCHAR(50) NOT NULL,
            origin_name VARCHAR(200),
            waypoints TEXT,
            dest_name VARCHAR(200),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
            PRIMARY KEY (id)
        )
    """)
    
    op.execute("""
        INSERT INTO business_type_routes_new (id, business_type, origin_name, waypoints, dest_name, created_at, updated_at)
        SELECT id, business_type, origin_name, waypoints, dest_name, created_at, updated_at
        FROM business_type_routes
    """)
    
    op.execute("DROP TABLE business_type_routes")
    op.execute("ALTER TABLE business_type_routes_new RENAME TO business_type_routes")
    
    op.create_index('ix_business_type_routes_type', 'business_type_routes', ['business_type'], unique=True)


def downgrade() -> None:
    op.execute("""
        CREATE TABLE business_type_routes_old (
            id UUID NOT NULL,
            business_type VARCHAR(50) NOT NULL,
            origin_name VARCHAR(200) NOT NULL,
            waypoints TEXT,
            dest_name VARCHAR(200) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
            PRIMARY KEY (id)
        )
    """)
    
    op.execute("""
        INSERT INTO business_type_routes_old (id, business_type, origin_name, waypoints, dest_name, created_at, updated_at)
        SELECT id, business_type, COALESCE(origin_name, ''), waypoints, COALESCE(dest_name, ''), created_at, updated_at
        FROM business_type_routes
    """)
    
    op.execute("DROP TABLE business_type_routes")
    op.execute("ALTER TABLE business_type_routes_old RENAME TO business_type_routes")
    
    op.create_index('ix_business_type_routes_type', 'business_type_routes', ['business_type'], unique=True)
