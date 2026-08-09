"""Enforce cart item uniqueness per cart and product variant.

Revision ID: 0011_cart_item_uniqueness
Revises: 0010_timezone_aware_timestamps
Create Date: 2026-08-09
"""

from alembic import op
import sqlalchemy as sa


revision = "0011_cart_item_uniqueness"
down_revision = "0010_timezone_aware_timestamps"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_unique_constraint(
        "uq_cart_items_cart_variant",
        "cart_items",
        ["cart_id", "variant_id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_cart_items_cart_variant",
        "cart_items",
        type_="unique",
    )
