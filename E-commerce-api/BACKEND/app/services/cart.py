# this file contain the cart service logic

from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Cart, CartItem, ProductVariant
from app.repositories.cart import CartProductVariantRepository, CartRepository
from app.schemas.cart import CartItemCreate, CartItemUpdate


class CartServiceError(Exception):     # base class for all cart service errors
    def __init__(self, detail: str):  # initialize the cart service error with the detail
        self.detail = detail
        super().__init__(detail)


class CartNotFoundError(CartServiceError):    # raised when a cart is not found
    pass


class CartItemNotFoundError(CartServiceError):  # raised when a cart item is not found
    pass


class CartItemOwnershipError(CartServiceError):  # raised when a cart item does not belong to the user
    pass


class ProductVariantNotFoundError(CartServiceError):  # raised when a product variant is not found
    pass


class ProductUnavailableError(CartServiceError):  # raised when a product is not available
    pass


class InsufficientStockError(CartServiceError):  # raised when a product is out of stock
    pass


class CartService:
    def __init__(self, session: AsyncSession):  # initialize the cart service with the session
        self.cart_repo = CartRepository(session)
        self.variant_repo = CartProductVariantRepository(session)

    async def get_or_create_cart(self, user_id: UUID) -> Cart:  # get or create a cart for the user 
        cart = await self.cart_repo.get_by_user_id(user_id)
        if cart:
            return cart

        try:
            return await self.cart_repo.create_for_user(user_id)
        except IntegrityError:
            await self.cart_repo.session.rollback()
            return await self.cart_repo.get_by_user_id(user_id)

    async def add_item(self, user_id: UUID, item_in: CartItemCreate) -> CartItem:
        cart = await self.get_or_create_cart(user_id)
        variant = await self._get_available_variant(item_in.variant_id)

        existing_item = await self.cart_repo.get_item_by_cart_and_variant(
            cart.id, item_in.variant_id
        )
        new_quantity = item_in.quantity
        if existing_item:
            new_quantity += existing_item.quantity

        self._validate_stock(variant, new_quantity)

        if existing_item:
            return await self.cart_repo.update_item_quantity(
                cart, existing_item, new_quantity
            )

        try:
            return await self.cart_repo.add_item(cart, item_in)
        except IntegrityError:
            await self.cart_repo.session.rollback()
            existing_item = await self.cart_repo.get_item_by_cart_and_variant(
                cart.id, item_in.variant_id
            )
            if existing_item:
                new_quantity = existing_item.quantity + item_in.quantity
                self._validate_stock(variant, new_quantity)
                return await self.cart_repo.update_item_quantity(
                    cart, existing_item, new_quantity
                )
            raise

    async def update_item(
        self, user_id: UUID, item_id: int, item_in: CartItemUpdate
    ) -> CartItem:
        cart = await self.get_or_create_cart(user_id)
        item = await self._get_cart_item(cart, item_id)
        variant = await self._get_available_variant(item.variant_id)
        self._validate_stock(variant, item_in.quantity)
        return await self.cart_repo.update_item_quantity(cart, item, item_in.quantity)

    async def delete_item(self, user_id: UUID, item_id: int) -> None:
        cart = await self.get_or_create_cart(user_id)
        item = await self._get_cart_item(cart, item_id)
        await self.cart_repo.delete_item(cart, item)

    async def clear_cart(self, user_id: UUID) -> None:
        cart = await self.get_or_create_cart(user_id)
        await self.cart_repo.clear_items(cart)

    async def _get_cart_item(self, cart: Cart, item_id: int) -> CartItem:
        item = await self.cart_repo.get_item_by_id(item_id)
        if item is None:
            raise CartItemNotFoundError("Cart item not found.")

        if item.cart_id != cart.id:
            raise CartItemOwnershipError("Cart item does not belong to this cart.")

        return item

    async def _get_available_variant(self, variant_id: UUID) -> ProductVariant:
        variant = await self.variant_repo.get_by_id(variant_id)
        if variant is None:
            raise ProductVariantNotFoundError("Product variant not found.")

        if not variant.product or not variant.product.is_active:
            raise ProductUnavailableError("Product is not available.")

        return variant

    def _validate_stock(self, variant: ProductVariant, quantity: int) -> None:
        if quantity > variant.stock_quantity - variant.reserved_quantity:
            raise InsufficientStockError("Requested quantity exceeds available stock.")
