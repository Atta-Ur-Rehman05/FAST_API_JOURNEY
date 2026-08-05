"""Remove the unused seller role.

Existing seller accounts are demoted to customers, the least-privileged
remaining role, before rebuilding the PostgreSQL enum without ``seller``.
"""

from alembic import op


revision = "0008_remove_seller_role"
down_revision = "0007_variant_reservations"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE roletype RENAME TO roletype_old")
    op.execute("CREATE TYPE roletype AS ENUM ('customer', 'admin')")
    op.execute(
        """
        ALTER TABLE users
        ALTER COLUMN role TYPE roletype
        USING CASE
            WHEN role::text = 'seller' THEN 'customer'::roletype
            ELSE role::text::roletype
        END
        """
    )
    op.execute("DROP TYPE roletype_old")


def downgrade() -> None:
    op.execute("ALTER TYPE roletype RENAME TO roletype_old")
    op.execute("CREATE TYPE roletype AS ENUM ('customer', 'admin', 'seller')")
    op.execute(
        "ALTER TABLE users ALTER COLUMN role TYPE roletype USING role::text::roletype"
    )
    op.execute("DROP TYPE roletype_old")
