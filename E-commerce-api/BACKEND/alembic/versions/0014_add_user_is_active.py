"""add_user_is_active

Revision ID: 85b13e4892ad
Revises: 0013_order_failed_status
Create Date: 2026-08-13 22:42:56.940396

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '85b13e4892ad'
down_revision: Union[str, Sequence[str], None] = '0013_order_failed_status'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("users", sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("users", "is_active")
