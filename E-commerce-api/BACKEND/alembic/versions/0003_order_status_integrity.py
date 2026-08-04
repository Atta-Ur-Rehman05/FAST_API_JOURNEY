"""Add the draft order state used for safely editable orders."""

from alembic import op


revision = "0003_order_status_integrity"
down_revision = "0002_checkout_idempotency"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # PostgreSQL enums cannot have a value removed, so downgrade deliberately
    # leaves the value in place.  IF NOT EXISTS makes this safe for databases
    # that were updated manually before this migration was deployed.
    op.execute("ALTER TYPE orderstatus ADD VALUE IF NOT EXISTS 'draft'")


def downgrade() -> None:
    pass
