"""Enforce maximum one primary image per product.

Revision ID: 0012_primary_image_uniqueness
Revises: 0011_cart_item_uniqueness
Create Date: 2026-08-09
"""

from alembic import op
import sqlalchemy as sa


revision = "0012_primary_image_uniqueness"
down_revision = "0011_cart_item_uniqueness"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "uq_product_images_one_primary_per_product",
        "product_images",
        ["product_id"],
        unique=True,
        postgresql_where=sa.text("is_primary"),
        sqlite_where=sa.text("is_primary"),
    )


def downgrade() -> None:
    op.drop_index(
        "uq_product_images_one_primary_per_product",
        table_name="product_images",
    )
