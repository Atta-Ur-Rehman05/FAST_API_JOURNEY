from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Address, Order, OrderItem, ProductVariant
from app.repositories.order import (
    OrderAddressRepository,
    OrderItemRepository,
    OrderProductVariantRepository,
    OrderRepository,
)
from app.schemas.order import OrderCreate, OrderItemCreate, OrderItemUpdate, OrderUpdate


class OrderServiceError(Exception):
    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)


class OrderNotFoundError(OrderServiceError):
    pass


class OrderItemNotFoundError(OrderServiceError):
    pass


class OrderOwnershipError(OrderServiceError):
    pass


class OrderItemOwnershipError(OrderServiceError):
    pass


class AddressNotFoundError(OrderServiceError):
    pass


class AddressOwnershipError(OrderServiceError):
    pass


class ProductVariantNotFoundError(OrderServiceError):
    pass


class ProductUnavailableError(OrderServiceError):
    pass


class InsufficientStockError(OrderServiceError):
    pass


class OrderService:
    def __init__(self, session: AsyncSession):
        self.order_repo = OrderRepository(session)
        self.item_repo = OrderItemRepository(session)
        self.address_repo = OrderAddressRepository(session)
        self.variant_repo = OrderProductVariantRepository(session)

    async def list_orders(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
        user_id: UUID | None = None,
    ) -> list[Order]:
        return await self.order_repo.list(skip=skip, limit=limit, user_id=user_id)

    async def create_order(self, user_id: UUID, order_in: OrderCreate) -> Order:
        await self._validate_user_address(user_id, order_in.shipping_address_id)
        await self._validate_user_address(user_id, order_in.billing_address_id)
        return await self.order_repo.create(user_id, order_in)

    async def get_order(self, order_id: UUID) -> Order:
        order = await self.order_repo.get_by_id(order_id)
        if order is None:
            raise OrderNotFoundError("Order not found.")
        return order

    async def get_user_order(self, user_id: UUID, order_id: UUID) -> Order:
        order = await self.get_order(order_id)
        self._validate_order_owner(order, user_id)
        return order

    async def update_order(self, order_id: UUID, order_in: OrderUpdate) -> Order:
        order = await self.get_order(order_id)

        if order_in.shipping_address_id is not None:
            await self._validate_user_address(order.user_id, order_in.shipping_address_id)

        if order_in.billing_address_id is not None:
            await self._validate_user_address(order.user_id, order_in.billing_address_id)

        return await self.order_repo.update(order, order_in)

    async def delete_order(self, order_id: UUID) -> None:
        order = await self.get_order(order_id)
        await self.order_repo.delete(order)

    async def add_item(
        self, user_id: UUID, order_id: UUID, item_in: OrderItemCreate
    ) -> OrderItem:
        order = await self.get_user_order(user_id, order_id)
        variant = await self._get_available_variant(item_in.variant_id)
        self._validate_stock(variant, item_in.quantity)
        return await self.item_repo.create(order, item_in)

    async def update_item(
        self, user_id: UUID, order_id: UUID, item_id: int, item_in: OrderItemUpdate
    ) -> OrderItem:
        order = await self.get_user_order(user_id, order_id)
        item = await self._get_order_item(order, item_id)

        if item_in.quantity is not None:
            variant = await self._get_available_variant(item.variant_id)
            self._validate_stock(variant, item_in.quantity)

        return await self.item_repo.update(order, item, item_in)

    async def delete_item(self, user_id: UUID, order_id: UUID, item_id: int) -> None:
        order = await self.get_user_order(user_id, order_id)
        item = await self._get_order_item(order, item_id)
        await self.item_repo.delete(order, item)

    async def _validate_user_address(self, user_id: UUID, address_id: UUID) -> Address:
        address = await self.address_repo.get_by_id(address_id)
        if address is None:
            raise AddressNotFoundError("Address not found.")

        if address.user_id != user_id:
            raise AddressOwnershipError("Address does not belong to this user.")

        return address

    def _validate_order_owner(self, order: Order, user_id: UUID) -> None:
        if order.user_id != user_id:
            raise OrderOwnershipError("Order does not belong to this user.")

    async def _get_order_item(self, order: Order, item_id: int) -> OrderItem:
        item = await self.item_repo.get_by_id(item_id)
        if item is None:
            raise OrderItemNotFoundError("Order item not found.")

        if item.order_id != order.id:
            raise OrderItemOwnershipError("Order item does not belong to this order.")

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
