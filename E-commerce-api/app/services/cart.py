from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Cart, CartItem, ProductVariant
from app.repositories.cart import CartProductVariantRepository, CartRepository
from app.schemas.cart import CartItemCreate, CartItemUpdate


class CartServiceError(Exception):
    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)


class CartNotFoundError(CartServiceError):
    pass


class CartItemNotFoundError(CartServiceError):
    pass


class CartItemOwnershipError(CartServiceError):
    pass


class ProductVariantNotFoundError(CartServiceError):
    pass


class ProductUnavailableError(CartServiceError):
    pass


class InsufficientStockError(CartServiceError):
    pass


class CartService:
    def __init__(self, session: AsyncSession):
        self.cart_repo = CartRepository(session)
        self.variant_repo = CartProductVariantRepository(session)

    async def get_or_create_cart(self, user_id: UUID) -> Cart:
        cart = await self.cart_repo.get_by_user_id(user_id)
        if cart:
            return cart

        return await self.cart_repo.create_for_user(user_id)

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

        return await self.cart_repo.add_item(cart, item_in)

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
        if quantity > variant.stock_quantity:
            raise InsufficientStockError("Requested quantity exceeds available stock.")
