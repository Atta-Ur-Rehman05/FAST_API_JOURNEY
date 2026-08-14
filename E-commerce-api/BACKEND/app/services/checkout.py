# this file is for checkout management logic

from decimal import Decimal
import hashlib
import json
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Address, Cart, Payment, ProductVariant
from app.repositories.checkout import CheckoutRepository
from app.schemas.checkout import CheckoutCreate
from app.core.metrics import CHECKOUT_RESULTS, STOCK_CONFLICTS


from app.core.config import settings

DEFAULT_TAX_RATE = Decimal("0.05")
DEFAULT_SHIPPING_FLAT = Decimal("99.00")
FREE_SHIPPING_THRESHOLD = Decimal("999.00")


class CheckoutServiceError(Exception):
    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)


class CartNotFoundError(CheckoutServiceError):
    pass


class EmptyCartError(CheckoutServiceError):
    pass


class AddressNotFoundError(CheckoutServiceError):
    pass


class AddressOwnershipError(CheckoutServiceError):
    pass


class ProductVariantNotFoundError(CheckoutServiceError):
    pass


class ProductUnavailableError(CheckoutServiceError):
    pass


class InsufficientStockError(CheckoutServiceError):
    pass


class IdempotencyConflictError(CheckoutServiceError):
    pass


class CheckoutService:
    def __init__(self, session: AsyncSession):
        self.checkout_repo = CheckoutRepository(session)

    async def checkout(
        self,
        user_id: UUID,
        checkout_in: CheckoutCreate,
        idempotency_key: str | None = None,
    ):
        """Create an order atomically, with database locks held until commit."""
        fingerprint = self._request_fingerprint(checkout_in)

        # The request's authentication dependency may already have started a
        # transaction with its user lookup.  Continue in that transaction so
        # locks acquired below remain held through the final commit.
        try:
            await self._validate_user_address(user_id, checkout_in.shipping_address_id)
            await self._validate_user_address(user_id, checkout_in.billing_address_id)

            # Locking the cart serializes attempts for this customer.  This
            # also makes a retried idempotent request observe the completed
            # checkout record instead of attempting a second order.
            cart = await self.checkout_repo.get_cart_for_checkout(user_id)

            checkout_request = None
            if idempotency_key:
                checkout_request = await self.checkout_repo.get_checkout_request(
                    user_id, idempotency_key
                )
                if checkout_request is not None:
                    if checkout_request.request_fingerprint != fingerprint:
                        raise IdempotencyConflictError(
                            "Idempotency-Key was already used with a different checkout request."
                        )
                    if checkout_request.order_id is not None:
                        result = await self.checkout_repo.get_checkout_result(
                            checkout_request.order_id
                        )
                        await self.checkout_repo.session.commit()
                        return result
                else:
                    checkout_request = await self.checkout_repo.create_checkout_request(
                        user_id=user_id,
                        idempotency_key=idempotency_key,
                        request_fingerprint=fingerprint,
                    )

            self._validate_cart(cart)

            locked_variants = await self.checkout_repo.lock_variants(
                [item.variant_id for item in cart.items]
            )
            total_amount = Decimal("0")
            for item in cart.items:
                variant = locked_variants.get(item.variant_id)
                self._validate_variant(variant)
                self._validate_stock(variant, item.quantity)
                item.variant = variant
                total_amount += (variant.product.base_price + variant.price_modifier) * item.quantity

            tax_rate = Decimal(str(settings.TAX_RATE)) if getattr(settings, "TAX_RATE", None) is not None else DEFAULT_TAX_RATE
            shipping_flat = Decimal(str(settings.SHIPPING_FLAT)) if getattr(settings, "SHIPPING_FLAT", None) is not None else DEFAULT_SHIPPING_FLAT
            free_shipping_threshold = Decimal(str(settings.FREE_SHIPPING_THRESHOLD)) if getattr(settings, "FREE_SHIPPING_THRESHOLD", None) is not None else FREE_SHIPPING_THRESHOLD

            tax_amount = total_amount * tax_rate
            shipping_amount = shipping_flat if total_amount < free_shipping_threshold else Decimal("0")
            grand_total = total_amount + tax_amount + shipping_amount

            order, payment = await self.checkout_repo.create_checkout_order(
                user_id=user_id,
                cart=cart,
                checkout_in=checkout_in,
                total_amount=grand_total,
                checkout_request=checkout_request,
            )
            await self.checkout_repo.session.commit()
            CHECKOUT_RESULTS.labels(result="success").inc()
            result = await self.checkout_repo.get_checkout_result(order.id)
            return {
                "order": result[0],
                "payment": result[1],
                "subtotal_amount": float(total_amount),
                "tax_amount": float(tax_amount),
                "shipping_amount": float(shipping_amount),
            }
        except CheckoutServiceError:
            CHECKOUT_RESULTS.labels(result="failure").inc()
            await self.checkout_repo.session.rollback()
            raise
        except Exception:
            await self.checkout_repo.session.rollback()
            raise

    @staticmethod
    def _request_fingerprint(checkout_in: CheckoutCreate) -> str:
        payload = json.dumps(
            checkout_in.model_dump(mode="json"),
            sort_keys=True,
            separators=(",", ":"),
        )
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    async def _validate_user_address(self, user_id: UUID, address_id: UUID) -> Address:
        address = await self.checkout_repo.get_address_by_id(address_id)
        if address is None:
            raise AddressNotFoundError("Address not found.")

        if address.user_id != user_id:
            raise AddressOwnershipError("Address does not belong to this user.")

        return address

    def _validate_cart(self, cart: Cart | None) -> None:
        if cart is None:
            raise CartNotFoundError("Cart not found.")

        if not cart.items:
            raise EmptyCartError("Cart is empty.")

    def _validate_variant(self, variant: ProductVariant | None) -> None:
        if variant is None:
            raise ProductVariantNotFoundError("Product variant not found.")

        if not variant.product or not variant.product.is_active:
            raise ProductUnavailableError("Product is not available.")

    def _validate_stock(self, variant: ProductVariant, quantity: int) -> None:
        if quantity > variant.stock_quantity - variant.reserved_quantity:
            STOCK_CONFLICTS.inc()
            raise InsufficientStockError("Requested quantity exceeds available stock.")

    async def set_payment_transaction_id(
        self, payment: Payment, transaction_id: str
    ) -> None:
        """Persist provider metadata as a separate, service-owned unit of work."""
        try:
            payment.transaction_id = transaction_id
            self.checkout_repo.session.add(payment)
            await self.checkout_repo.session.commit()
        except Exception:
            await self.checkout_repo.session.rollback()
            raise
