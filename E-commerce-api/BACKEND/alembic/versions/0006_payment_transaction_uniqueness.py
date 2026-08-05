"""Enforce one local payment per provider transaction ID."""

from alembic import op


revision = "0006_payment_txn_unique"
down_revision = "0005_stripe_webhook_events"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # PostgreSQL UNIQUE permits multiple NULL values, so offline/non-provider
    # payments can remain without a transaction ID.
    op.create_unique_constraint(
        "uq_payments_transaction_id", "payments", ["transaction_id"]
    )


def downgrade() -> None:
    op.drop_constraint("uq_payments_transaction_id", "payments", type_="unique")
