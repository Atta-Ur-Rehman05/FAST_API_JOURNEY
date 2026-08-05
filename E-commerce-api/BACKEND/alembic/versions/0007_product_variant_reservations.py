"""add product variant reservation quantity

Revision ID: 0007_product_variant_reservations
Revises: 0006_payment_txn_unique
Create Date: 2026-08-05
"""

from alembic import op
import sqlalchemy as sa


revision = "0007_variant_reservations"
down_revision = "0006_payment_txn_unique"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "product_variants",
        sa.Column("reserved_quantity", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_check_constraint(
        "ck_product_variants_reserved_quantity_non_negative",
        "product_variants",
        "reserved_quantity >= 0",
    )
    op.create_check_constraint(
        "ck_product_variants_reserved_quantity_within_stock",
        "product_variants",
        "reserved_quantity <= stock_quantity",
    )
    op.alter_column("product_variants", "reserved_quantity", server_default=None)


def downgrade() -> None:
    op.drop_constraint(
        "ck_product_variants_reserved_quantity_within_stock",
        "product_variants",
        type_="check",
    )
    op.drop_constraint(
        "ck_product_variants_reserved_quantity_non_negative",
        "product_variants",
        type_="check",
    )
    op.drop_column("product_variants", "reserved_quantity")
