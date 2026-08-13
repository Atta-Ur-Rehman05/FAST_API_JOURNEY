import uuid
import enum
from decimal import Decimal

from sqlalchemy import CheckConstraint, Column, String, Integer, Text, Boolean, Numeric, ForeignKey, DateTime, Enum, Index, UniqueConstraint, text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.db.db import Base
from app.core.time import utc_now

# ============================
# Enums
# ============================

class RoleType(enum.Enum):
    customer = "customer"
    admin = "admin"

class AddressType(str, enum.Enum):
    Home = "Home"
    Office = "Office"
    Other = "Other"
    shipping = "shipping"
    billing = "billing"

class OrderStatus(enum.Enum):
    draft = "draft"
    pending = "pending"
    processing = "processing"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"
    failed = "failed"

class PaymentMethod(enum.Enum):
    credit_card = "credit_card"
    paypal = "paypal"
    stripe = "stripe"
    cod = "cod"

class PaymentStatus(enum.Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"
    refunded = "refunded"

# ============================
# User Management Module
# ============================

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    role = Column(Enum(RoleType), default=RoleType.customer, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # Relationships
    addresses = relationship("Address", back_populates="user", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="user")
    cart = relationship("Cart", back_populates="user", uselist=False)
    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    password_reset_tokens = relationship("PasswordResetToken", back_populates="user", cascade="all, delete-orphan")

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_id = Column(String(36), nullable=False, unique=True, index=True)
    token_hash = Column(String(64), nullable=False, unique=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    user = relationship("User", back_populates="refresh_tokens")

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(64), nullable=False, unique=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    user = relationship("User", back_populates="password_reset_tokens")

class Address(Base):
    __tablename__ = "addresses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    full_name = Column(String, nullable=False, default="")
    phone = Column(String, nullable=False, default="")
    address_line_1 = Column(String, nullable=False, default="")
    address_line_2 = Column(String, nullable=True)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    postal_code = Column(String, nullable=False)
    country = Column(String, nullable=False)
    address_type = Column(Enum(AddressType), default=AddressType.Home, nullable=False)
    is_default_shipping = Column(Boolean, default=False, nullable=False)
    is_default_billing = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # Relationships
    user = relationship("User", back_populates="addresses")

    __table_args__ = (
        Index(
            "uq_addresses_default_shipping_per_user", "user_id", unique=True,
            postgresql_where=text("is_default_shipping"), sqlite_where=text("is_default_shipping"),
        ),
        Index(
            "uq_addresses_default_billing_per_user", "user_id", unique=True,
            postgresql_where=text("is_default_billing"), sqlite_where=text("is_default_billing"),
        ),
    )

    def __init__(self, **kwargs):
        if "street_address" in kwargs and "address_line_1" not in kwargs:
            kwargs["address_line_1"] = kwargs.pop("street_address")
        if "phone_number" in kwargs and "phone" not in kwargs:
            kwargs["phone"] = kwargs.pop("phone_number")
        if "full_name" not in kwargs:
            kwargs["full_name"] = "Default User"
        super().__init__(**kwargs)

    @property
    def street_address(self) -> str:
        return self.address_line_1

    @street_address.setter
    def street_address(self, value: str):
        self.address_line_1 = value

    @property
    def phone_number(self) -> str:
        return self.phone

    @phone_number.setter
    def phone_number(self, value: str):
        self.phone = value

# ============================
# Product Catalog Module
# ============================

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    parent_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)

    # Relationships
    parent = relationship("Category", remote_side=[id], back_populates="subcategories")
    subcategories = relationship("Category", back_populates="parent")
    products = relationship("Product", back_populates="category")

class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=True)
    base_price = Column(Numeric(10, 2), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # Relationships
    category = relationship("Category", back_populates="products")
    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="product", cascade="all, delete-orphan")

    __table_args__ = (CheckConstraint("base_price >= 0", name="ck_products_base_price_non_negative"),)

class ProductVariant(Base):
    __tablename__ = "product_variants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    sku = Column(String, unique=True, nullable=False)
    price_modifier = Column(Numeric(10, 2), default=0.0)
    stock_quantity = Column(Integer, default=0, nullable=False)
    # Physical stock on hand. Open orders reserve part of it until delivery or
    # cancellation, so sellable stock is stock_quantity - reserved_quantity.
    reserved_quantity = Column(Integer, default=0, nullable=False)
    attributes = Column(JSONB, nullable=True)

    # Relationships
    product = relationship("Product", back_populates="variants")

    __table_args__ = (
        CheckConstraint("price_modifier >= 0", name="ck_product_variants_price_modifier_non_negative"),
        CheckConstraint("stock_quantity >= 0", name="ck_product_variants_stock_non_negative"),
        CheckConstraint("reserved_quantity >= 0", name="ck_product_variants_reserved_quantity_non_negative"),
        CheckConstraint("reserved_quantity <= stock_quantity", name="ck_product_variants_reserved_quantity_within_stock"),
    )

    @property
    def available_quantity(self) -> int:
        """Units that can still be added to a cart or checked out."""
        return self.stock_quantity - self.reserved_quantity

class ProductImage(Base):
    __tablename__ = "product_images"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    image_url = Column(String, nullable=False)
    is_primary = Column(Boolean, default=False)

    # Relationships
    product = relationship("Product", back_populates="images")

    __table_args__ = (
        Index(
            "uq_product_images_one_primary_per_product", "product_id", unique=True,
            postgresql_where=text("is_primary"), sqlite_where=text("is_primary"),
        ),
    )


# ============================
# Reviews Module
# ============================

class Review(Base):
    __tablename__ = "reviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # Relationships
    user = relationship("User", back_populates="reviews")
    product = relationship("Product", back_populates="reviews")

    __table_args__ = (
        UniqueConstraint("user_id", "product_id", name="uq_reviews_user_product"),
        CheckConstraint("rating BETWEEN 1 AND 5", name="ck_reviews_rating_range"),
    )


# ============================
# Cart & Order Modules
# ============================

class Cart(Base):
    __tablename__ = "carts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # Relationships
    user = relationship("User", back_populates="cart")
    items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")

class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    cart_id = Column(UUID(as_uuid=True), ForeignKey("carts.id", ondelete="CASCADE"), nullable=False, index=True)
    variant_id = Column(UUID(as_uuid=True), ForeignKey("product_variants.id", ondelete="RESTRICT"), nullable=False, index=True)
    quantity = Column(Integer, default=1, nullable=False)

    # Relationships
    cart = relationship("Cart", back_populates="items")
    variant = relationship("ProductVariant")

    __table_args__ = (
        UniqueConstraint("cart_id", "variant_id", name="uq_cart_items_cart_variant"),
        CheckConstraint("quantity > 0", name="ck_cart_items_quantity_positive"),
    )

    @property
    def unit_price(self) -> Decimal:
        """Current checkout price for one unit of this cart item."""
        return self.variant.product.base_price + self.variant.price_modifier


class CheckoutRequest(Base):
    """Records a client retry key and the order produced by that checkout."""
    __tablename__ = "checkout_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    idempotency_key = Column(String(255), nullable=False)
    request_fingerprint = Column(String(64), nullable=False)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="RESTRICT"), nullable=True, unique=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    __table_args__ = (UniqueConstraint("user_id", "idempotency_key", name="uq_checkout_requests_user_key"),)

class Order(Base):
    __tablename__ = "orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    shipping_address_id = Column(UUID(as_uuid=True), ForeignKey("addresses.id", ondelete="RESTRICT"), nullable=False, index=True)
    billing_address_id = Column(UUID(as_uuid=True), ForeignKey("addresses.id", ondelete="RESTRICT"), nullable=False, index=True)
    total_amount = Column(Numeric(10, 2), nullable=False)
    order_status = Column(Enum(OrderStatus), default=OrderStatus.draft, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # Relationships
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="order", uselist=False, cascade="all, delete-orphan")

    shipping_address = relationship("Address", foreign_keys=[shipping_address_id])
    billing_address = relationship("Address", foreign_keys=[billing_address_id])

    __table_args__ = (CheckConstraint("total_amount >= 0", name="ck_orders_total_amount_non_negative"),)

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    variant_id = Column(UUID(as_uuid=True), ForeignKey("product_variants.id", ondelete="RESTRICT"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    price_per_item = Column(Numeric(10, 2), nullable=False)

    # Relationships
    order = relationship("Order", back_populates="items")
    variant = relationship("ProductVariant")

    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_order_items_quantity_positive"),
        CheckConstraint("price_per_item >= 0", name="ck_order_items_price_non_negative"),
    )


# ============================
# Payment Module
# ============================

class Payment(Base):
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, unique=True)
    payment_method = Column(Enum(PaymentMethod), nullable=False)
    # For Stripe this is the PaymentIntent ID. A provider transaction may
    # belong to only one local payment record.
    transaction_id = Column(String, nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.pending, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    # Relationships
    order = relationship("Order", back_populates="payment")

    __table_args__ = (
        CheckConstraint("amount >= 0", name="ck_payments_amount_non_negative"),
        UniqueConstraint("transaction_id", name="uq_payments_transaction_id"),
    )


class StripeWebhookEvent(Base):
    """A successfully processed Stripe event, retained for webhook idempotency."""
    __tablename__ = "stripe_webhook_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    stripe_event_id = Column(String(255), nullable=False, unique=True)
    event_type = Column(String(100), nullable=False)
    payment_id = Column(UUID(as_uuid=True), ForeignKey("payments.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
