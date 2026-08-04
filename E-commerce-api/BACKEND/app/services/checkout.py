from decimal import Decimal
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Address, Cart, ProductVariant
from app.repositories.checkout import CheckoutRepository
from app.schemas.checkout import CheckoutCreate


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


class CheckoutService:
    def __init__(self, session: AsyncSession):
        self.checkout_repo = CheckoutRepository(session)

    async def checkout(self, user_id: UUID, checkout_in: CheckoutCreate):
        await self._validate_user_address(user_id, checkout_in.shipping_address_id)
        await self._validate_user_address(user_id, checkout_in.billing_address_id)

        cart = await self.checkout_repo.get_cart_for_checkout(user_id)
        self._validate_cart(cart)

        total_amount = Decimal("0")
        for item in cart.items:
            variant = item.variant
            self._validate_variant(variant)
            self._validate_stock(variant, item.quantity)
            total_amount += (variant.product.base_price + variant.price_modifier) * item.quantity

        return await self.checkout_repo.create_checkout_order(
            user_id=user_id,
            cart=cart,
            checkout_in=checkout_in,
            total_amount=total_amount,
        )

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
        if quantity > variant.stock_quantity:
            raise InsufficientStockError("Requested quantity exceeds available stock.")
