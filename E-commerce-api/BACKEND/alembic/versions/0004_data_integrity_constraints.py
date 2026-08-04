"""Enforce catalog, cart, review, and foreign-key data integrity."""

from alembic import op
import sqlalchemy as sa


revision = "0004_data_integrity_constraints"
down_revision = "0003_order_status_integrity"
branch_labels = None
depends_on = None


FOREIGN_KEYS = (
    ("addresses", "addresses_user_id_fkey", "fk_addresses_user_id_users", ["user_id"], "users", ["id"], "CASCADE"),
    ("categories", "categories_parent_id_fkey", "fk_categories_parent_id_categories", ["parent_id"], "categories", ["id"], "SET NULL"),
    ("products", "products_category_id_fkey", "fk_products_category_id_categories", ["category_id"], "categories", ["id"], "RESTRICT"),
    ("product_variants", "product_variants_product_id_fkey", "fk_product_variants_product_id_products", ["product_id"], "products", ["id"], "CASCADE"),
    ("product_images", "product_images_product_id_fkey", "fk_product_images_product_id_products", ["product_id"], "products", ["id"], "CASCADE"),
    ("reviews", "reviews_product_id_fkey", "fk_reviews_product_id_products", ["product_id"], "products", ["id"], "CASCADE"),
    ("reviews", "reviews_user_id_fkey", "fk_reviews_user_id_users", ["user_id"], "users", ["id"], "CASCADE"),
    ("carts", "carts_user_id_fkey", "fk_carts_user_id_users", ["user_id"], "users", ["id"], "CASCADE"),
    ("cart_items", "cart_items_cart_id_fkey", "fk_cart_items_cart_id_carts", ["cart_id"], "carts", ["id"], "CASCADE"),
    ("cart_items", "cart_items_variant_id_fkey", "fk_cart_items_variant_id_product_variants", ["variant_id"], "product_variants", ["id"], "RESTRICT"),
    ("checkout_requests", "checkout_requests_user_id_fkey", "fk_checkout_requests_user_id_users", ["user_id"], "users", ["id"], "CASCADE"),
    ("checkout_requests", "checkout_requests_order_id_fkey", "fk_checkout_requests_order_id_orders", ["order_id"], "orders", ["id"], "RESTRICT"),
    ("orders", "orders_user_id_fkey", "fk_orders_user_id_users", ["user_id"], "users", ["id"], "RESTRICT"),
    ("orders", "orders_shipping_address_id_fkey", "fk_orders_shipping_address_id_addresses", ["shipping_address_id"], "addresses", ["id"], "RESTRICT"),
    ("orders", "orders_billing_address_id_fkey", "fk_orders_billing_address_id_addresses", ["billing_address_id"], "addresses", ["id"], "RESTRICT"),
    ("order_items", "order_items_order_id_fkey", "fk_order_items_order_id_orders", ["order_id"], "orders", ["id"], "CASCADE"),
    ("order_items", "order_items_variant_id_fkey", "fk_order_items_variant_id_product_variants", ["variant_id"], "product_variants", ["id"], "RESTRICT"),
    ("payments", "payments_order_id_fkey", "fk_payments_order_id_orders", ["order_id"], "orders", ["id"], "CASCADE"),
)


def upgrade() -> None:
    # Existing data must meet these conditions before deployment.  PostgreSQL
    # will reject the migration instead of silently altering financial data.
    op.alter_column("carts", "user_id", existing_type=sa.UUID(), nullable=False)

    for table, old_name, new_name, columns, target_table, target_columns, ondelete in FOREIGN_KEYS:
        op.drop_constraint(old_name, table, type_="foreignkey")
        op.create_foreign_key(new_name, table, target_table, columns, target_columns, ondelete=ondelete)

    for table, name, condition in (
        ("products", "ck_products_base_price_non_negative", "base_price >= 0"),
        ("product_variants", "ck_product_variants_price_modifier_non_negative", "price_modifier >= 0"),
        ("product_variants", "ck_product_variants_stock_non_negative", "stock_quantity >= 0"),
        ("reviews", "ck_reviews_rating_range", "rating BETWEEN 1 AND 5"),
        ("cart_items", "ck_cart_items_quantity_positive", "quantity > 0"),
        ("orders", "ck_orders_total_amount_non_negative", "total_amount >= 0"),
        ("order_items", "ck_order_items_quantity_positive", "quantity > 0"),
        ("order_items", "ck_order_items_price_non_negative", "price_per_item >= 0"),
        ("payments", "ck_payments_amount_non_negative", "amount >= 0"),
    ):
        op.create_check_constraint(name, table, condition)

    op.create_unique_constraint("uq_carts_user_id", "carts", ["user_id"])
    op.create_unique_constraint("uq_reviews_user_product", "reviews", ["user_id", "product_id"])
    op.create_unique_constraint("uq_payments_order_id", "payments", ["order_id"])
    op.create_index("uq_addresses_default_shipping_per_user", "addresses", ["user_id"], unique=True, postgresql_where=sa.text("is_default_shipping"))
    op.create_index("uq_addresses_default_billing_per_user", "addresses", ["user_id"], unique=True, postgresql_where=sa.text("is_default_billing"))

    for table, name, columns in (
        ("addresses", "ix_addresses_user_id", ["user_id"]),
        ("categories", "ix_categories_parent_id", ["parent_id"]),
        ("products", "ix_products_category_id", ["category_id"]),
        ("product_variants", "ix_product_variants_product_id", ["product_id"]),
        ("product_images", "ix_product_images_product_id", ["product_id"]),
        ("reviews", "ix_reviews_product_id", ["product_id"]),
        ("reviews", "ix_reviews_user_id", ["user_id"]),
        ("cart_items", "ix_cart_items_cart_id", ["cart_id"]),
        ("cart_items", "ix_cart_items_variant_id", ["variant_id"]),
        ("checkout_requests", "ix_checkout_requests_user_id", ["user_id"]),
        ("orders", "ix_orders_user_id", ["user_id"]),
        ("orders", "ix_orders_shipping_address_id", ["shipping_address_id"]),
        ("orders", "ix_orders_billing_address_id", ["billing_address_id"]),
        ("order_items", "ix_order_items_order_id", ["order_id"]),
        ("order_items", "ix_order_items_variant_id", ["variant_id"]),
    ):
        op.create_index(name, table, columns)


def downgrade() -> None:
    for table, name, _ in reversed((
        ("addresses", "ix_addresses_user_id", ["user_id"]), ("categories", "ix_categories_parent_id", ["parent_id"]),
        ("products", "ix_products_category_id", ["category_id"]), ("product_variants", "ix_product_variants_product_id", ["product_id"]),
        ("product_images", "ix_product_images_product_id", ["product_id"]), ("reviews", "ix_reviews_product_id", ["product_id"]),
        ("reviews", "ix_reviews_user_id", ["user_id"]), ("cart_items", "ix_cart_items_cart_id", ["cart_id"]),
        ("cart_items", "ix_cart_items_variant_id", ["variant_id"]), ("checkout_requests", "ix_checkout_requests_user_id", ["user_id"]),
        ("orders", "ix_orders_user_id", ["user_id"]), ("orders", "ix_orders_shipping_address_id", ["shipping_address_id"]),
        ("orders", "ix_orders_billing_address_id", ["billing_address_id"]), ("order_items", "ix_order_items_order_id", ["order_id"]),
        ("order_items", "ix_order_items_variant_id", ["variant_id"]),
    )):
        op.drop_index(name, table_name=table)

    op.drop_index("uq_addresses_default_billing_per_user", table_name="addresses")
    op.drop_index("uq_addresses_default_shipping_per_user", table_name="addresses")
    op.drop_constraint("uq_payments_order_id", "payments", type_="unique")
    op.drop_constraint("uq_reviews_user_product", "reviews", type_="unique")
    op.drop_constraint("uq_carts_user_id", "carts", type_="unique")

    for table, name, _ in reversed((
        ("products", "ck_products_base_price_non_negative", ""), ("product_variants", "ck_product_variants_price_modifier_non_negative", ""),
        ("product_variants", "ck_product_variants_stock_non_negative", ""), ("reviews", "ck_reviews_rating_range", ""),
        ("cart_items", "ck_cart_items_quantity_positive", ""), ("orders", "ck_orders_total_amount_non_negative", ""),
        ("order_items", "ck_order_items_quantity_positive", ""), ("order_items", "ck_order_items_price_non_negative", ""),
        ("payments", "ck_payments_amount_non_negative", ""),
    )):
        op.drop_constraint(name, table, type_="check")

    for table, old_name, new_name, columns, target_table, target_columns, _ in reversed(FOREIGN_KEYS):
        op.drop_constraint(new_name, table, type_="foreignkey")
        op.create_foreign_key(old_name, table, target_table, columns, target_columns)

    op.alter_column("carts", "user_id", existing_type=sa.UUID(), nullable=True)
