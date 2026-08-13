"""Add failed status to orderstatus enum for payment-failure scenarios.

Revision ID: 0013_order_failed_status
Revises: 0012_primary_image_uniqueness
Create Date: 2026-08-13
"""

from alembic import op


revision = "0013_order_failed_status"
down_revision = "0012_primary_image_uniqueness"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE orderstatus ADD VALUE IF NOT EXISTS 'failed'")


def downgrade() -> None:
    pass
