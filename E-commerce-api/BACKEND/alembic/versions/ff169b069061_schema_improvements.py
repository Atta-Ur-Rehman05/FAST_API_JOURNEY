"""schema_improvements

Revision ID: ff169b069061
Revises: 85b13e4892ad
Create Date: 2026-08-14 00:47:46.743933

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ff169b069061'
down_revision: Union[str, Sequence[str], None] = '85b13e4892ad'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column("products", "is_active", existing_type=sa.Boolean(), nullable=False, server_default=sa.text("true"))
    op.alter_column("product_variants", "price_modifier", existing_type=sa.Numeric(10, 2), nullable=False, server_default=sa.text("0"))
    op.alter_column("product_variants", "stock_quantity", existing_type=sa.Integer(), nullable=False, server_default=sa.text("0"))
    op.alter_column("orders", "order_status", existing_type=sa.Enum("pending", "processing", "shipped", "delivered", "cancelled", "draft", "failed", name="orderstatus"), server_default=sa.text("'draft'::orderstatus"))
    op.create_index("ix_orders_user_id_created_at", "orders", ["user_id", sa.text("created_at DESC")])
    op.alter_column("cart_items", "quantity", existing_type=sa.Integer(), nullable=False)
    op.drop_constraint("refresh_tokens_token_id_key", "refresh_tokens", type_="unique")
    op.drop_index("ix_refresh_tokens_token_id", table_name="refresh_tokens")


def downgrade() -> None:
    """Downgrade schema."""
    op.create_index("ix_refresh_tokens_token_id", "refresh_tokens", ["token_id"], unique=True)
    op.create_unique_constraint("refresh_tokens_token_id_key", "refresh_tokens", ["token_id"])
    op.alter_column("cart_items", "quantity", existing_type=sa.Integer(), nullable=True)
    op.drop_index("ix_orders_user_id_created_at", table_name="orders")
    op.alter_column("orders", "order_status", existing_type=sa.Enum("pending", "processing", "shipped", "delivered", "cancelled", "draft", "failed", name="orderstatus"), server_default=None)
    op.alter_column("product_variants", "stock_quantity", existing_type=sa.Integer(), nullable=True, server_default=None)
    op.alter_column("product_variants", "price_modifier", existing_type=sa.Numeric(10, 2), nullable=True, server_default=None)
    op.alter_column("products", "is_active", existing_type=sa.Boolean(), nullable=True, server_default=None)
