"""Store all timestamps as timezone-aware UTC values.

Existing timestamp-without-time-zone values are interpreted as UTC during the
PostgreSQL conversion, matching the application's historical UTC convention.
"""

from alembic import op
import sqlalchemy as sa


revision = "0010_timezone_aware_timestamps"
down_revision = "0009_auth_tokens"
branch_labels = None
depends_on = None


TIMESTAMP_COLUMNS = (
    ("users", "created_at"), ("users", "updated_at"),
    ("addresses", "created_at"), ("addresses", "updated_at"),
    ("products", "created_at"), ("products", "updated_at"),
    ("reviews", "created_at"), ("reviews", "updated_at"),
    ("carts", "created_at"), ("carts", "updated_at"),
    ("checkout_requests", "created_at"),
    ("orders", "created_at"), ("orders", "updated_at"),
    ("payments", "created_at"),
    ("stripe_webhook_events", "created_at"),
    ("refresh_tokens", "expires_at"), ("refresh_tokens", "revoked_at"),
    ("refresh_tokens", "created_at"),
    ("password_reset_tokens", "expires_at"),
    ("password_reset_tokens", "used_at"), ("password_reset_tokens", "created_at"),
)


def upgrade() -> None:
    for table, column in TIMESTAMP_COLUMNS:
        op.alter_column(
            table,
            column,
            type_=sa.DateTime(timezone=True),
            postgresql_using=f"{column} AT TIME ZONE 'UTC'",
        )


def downgrade() -> None:
    for table, column in TIMESTAMP_COLUMNS:
        op.alter_column(
            table,
            column,
            type_=sa.DateTime(timezone=False),
            postgresql_using=f"{column} AT TIME ZONE 'UTC'",
        )
