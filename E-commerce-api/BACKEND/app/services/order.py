# this file is for order management logic

from decimal import Decimal
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Address, Order, OrderItem, OrderStatus, PaymentStatus, ProductVariant
from app.repositories.order import (
    OrderAddressRepository,
    OrderItemRepository,
    OrderProductVariantRepository,
    OrderRepository,
)
from app.schemas.order import OrderCreate, OrderItemCreate, OrderItemUpdate, OrderUpdate
from app.core.time import utc_now


VALID_ORDER_TRANSITIONS: dict[OrderStatus, set[OrderStatus]] = {
    OrderStatus.draft: {OrderStatus.pending},
    OrderStatus.pending: {OrderStatus.processing, OrderStatus.cancelled, OrderStatus.failed},
    OrderStatus.processing: {OrderStatus.shipped, OrderStatus.cancelled, OrderStatus.failed},
    OrderStatus.shipped: {OrderStatus.delivered},
    OrderStatus.delivered: set(),
    OrderStatus.cancelled: set(),
    OrderStatus.failed: set(),
}


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


class OrderNotEditableError(OrderServiceError):
    pass


class InvalidOrderTransitionError(OrderServiceError):
    pass


class RefundRequiredError(OrderServiceError):
    pass


class OrderDeletionNotAllowedError(OrderServiceError):
    pass


class OrderService:
    def __init__(self, session: AsyncSession):
        self.order_repo = OrderRepository(session)
        self.item_repo = OrderItemRepository(session)
        self.address_repo = OrderAddressRepository(session)
        self.variant_repo = OrderProductVariantRepository(session)

    async def create_order(self, user_id: UUID, order_in: OrderCreate) -> Order:
        await self._validate_user_address(user_id, order_in.shipping_address_id)
        await self._validate_user_address(user_id, order_in.billing_address_id)
        order = Order(
            user_id=user_id,
            shipping_address_id=order_in.shipping_address_id,
            billing_address_id=order_in.billing_address_id,
            total_amount=0,
            order_status=OrderStatus.draft,
        )
        try:
            self.order_repo.session.add(order)
            await self.order_repo.session.flush()
            await self._calculate_and_set_order_total(order)
            await self.order_repo.session.commit()
        except Exception:
            await self.order_repo.session.rollback()
            raise
        return await self.get_order(order.id)

    async def get_order(self, order_id: UUID) -> Order:
        order = await self.order_repo.get_by_id(order_id)
        if order is None:
            raise OrderNotFoundError("Order not found.")
        try:
            await self.order_repo.session.refresh(order, attribute_names=["items"])
        except Exception:
            pass
        return order

    async def get_user_order(self, user_id: UUID, order_id: UUID) -> Order:
        order = await self.get_order(order_id)
        self._validate_order_owner(order, user_id)
        return order

    async def get_user_order_for_update(self, user_id: UUID, order_id: UUID) -> Order:
        order = await self.order_repo.get_by_id_for_update(order_id)
        if order is None:
            raise OrderNotFoundError("Order not found.")
        self._validate_order_owner(order, user_id)
        return order

    async def list_orders(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
        user_id: UUID | None = None,
    ) -> list[Order]:
        return await self.order_repo.list(skip=skip, limit=limit, user_id=user_id)

    async def count_orders(self, *, user_id: UUID | None = None) -> int:
        return await self.order_repo.count(user_id=user_id)

    async def update_order(self, order_id: UUID, order_in: OrderUpdate) -> Order:
        order = await self.get_order(order_id)
        if order.order_status in (OrderStatus.delivered, OrderStatus.cancelled, OrderStatus.failed):
            raise OrderNotEditableError("Completed orders cannot be modified.")
        update_data = order_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(order, field, value)
        order.updated_at = utc_now()
        self.order_repo.session.add(order)
        await self.order_repo.session.commit()
        return await self.get_order(order.id)

    async def delete_order(self, order_id: UUID) -> None:
        order = await self.get_order(order_id)
        if order.order_status not in (OrderStatus.draft, OrderStatus.cancelled):
            raise OrderDeletionNotAllowedError(
                "Only draft or cancelled orders can be deleted."
            )
        await self.order_repo.session.delete(order)
        await self.order_repo.session.commit()

    async def transition_status(self, order_id: UUID, new_status: OrderStatus) -> Order:
        order = await self.order_repo.get_by_id_for_update(order_id)
        if order is None:
            raise OrderNotFoundError("Order not found.")

        current_status = order.order_status
        if current_status == new_status:
            return order

        allowed = VALID_ORDER_TRANSITIONS.get(current_status, set())
        if new_status not in allowed:
            raise InvalidOrderTransitionError(
                f"Cannot transition order from {current_status.value} to {new_status.value}."
            )

        if new_status in (OrderStatus.cancelled, OrderStatus.failed):
            await self._release_order_reservations(order)
        elif new_status == OrderStatus.delivered:
            await self._consume_order_inventory(order)

        order.order_status = new_status
        order.updated_at = utc_now()
        self.order_repo.session.add(order)
        await self.order_repo.session.commit()
        return await self.get_order(order.id)

    async def request_cancellation(self, user_id: UUID, order_id: UUID) -> Order:
        order = await self.get_user_order_for_update(user_id, order_id)
        if order.order_status not in (OrderStatus.pending, OrderStatus.processing):
            raise InvalidOrderTransitionError(
                "Only pending or processing orders can be cancelled."
            )
        return await self.transition_status(order_id, OrderStatus.cancelled)

    async def add_item(self, user_id: UUID, order_id: UUID, item_in: OrderItemCreate) -> OrderItem:
        order = await self.get_user_order_for_update(user_id, order_id)
        self._validate_draft(order)
        variant = await self._get_available_variant(item_in.variant_id)

        existing_item = next(
            (item for item in order.items if item.variant_id == item_in.variant_id), None
        )
        total_requested = item_in.quantity + (existing_item.quantity if existing_item else 0)
        self._validate_stock(variant, total_requested)

        try:
            if existing_item:
                item = await self.item_repo.update(
                    order, existing_item, OrderItemUpdate(quantity=total_requested)
                )
            else:
                item = await self.item_repo.create(
                    order,
                    variant_id=variant.id,
                    quantity=item_in.quantity,
                    price_per_item=variant.product.base_price + variant.price_modifier,
                )
            await self.item_repo.recalculate_total(order)
            await self.order_repo.session.commit()
            return item
        except Exception:
            await self.order_repo.session.rollback()
            raise

    async def update_item(self, user_id: UUID, order_id: UUID, item_id: int, item_in: OrderItemUpdate) -> OrderItem:
        order = await self.get_user_order_for_update(user_id, order_id)
        self._validate_draft(order)
        item = await self._get_order_item(order, item_id)
        variant = await self._get_available_variant(item.variant_id)
        self._validate_stock(variant, item_in.quantity)

        try:
            updated_item = await self.item_repo.update(order, item, item_in)
            await self.item_repo.recalculate_total(order)
            await self.order_repo.session.commit()
            return updated_item
        except Exception:
            await self.order_repo.session.rollback()
            raise

    async def delete_item(self, user_id: UUID, order_id: UUID, item_id: int) -> None:
        order = await self.get_user_order_for_update(user_id, order_id)
        self._validate_draft(order)
        item = await self._get_order_item(order, item_id)
        try:
            await self.item_repo.delete(order, item)
            await self.item_repo.recalculate_total(order)
            await self.order_repo.session.commit()
        except Exception:
            await self.order_repo.session.rollback()
            raise

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

    def _validate_draft(self, order: Order) -> None:
        if order.order_status != OrderStatus.draft:
            raise OrderNotEditableError("Only draft orders can be modified.")

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
        available_stock = variant.stock_quantity - variant.reserved_quantity
        if quantity > available_stock:
            raise InsufficientStockError("Requested quantity exceeds available stock.")

    async def _calculate_and_set_order_total(self, order: Order) -> None:
        order_items = await self.item_repo.list_by_order_id(order.id)
        variant_ids = [item.variant_id for item in order_items]
        locked_variants = await self.variant_repo.lock_by_ids(variant_ids)

        total_amount = Decimal("0")
        order_items_data = []

        for item in order_items:
            variant = locked_variants[item.variant_id]
            self._validate_stock(variant, item.quantity)

            unit_price = variant.product.base_price + variant.price_modifier
            total_amount += unit_price * item.quantity

            order_items_data.append({
                "variant_id": item.variant_id,
                "quantity": item.quantity,
                "price_per_item": unit_price,
                "variant": variant,
            })

        await self.item_repo.delete_by_order_id(order.id)

        for item_data in order_items_data:
            await self.item_repo.create(
                order,
                variant_id=item_data["variant_id"],
                quantity=item_data["quantity"],
                price_per_item=item_data["price_per_item"],
            )

        order.total_amount = total_amount

    async def _release_order_reservations(self, order: Order) -> None:
        items = await self.item_repo.list_by_order_id(order.id)
        for item in items:
            variant = await self.variant_repo.get_by_id(item.variant_id)
            if variant is None:
                continue
            release_qty = min(item.quantity, variant.reserved_quantity)
            if release_qty <= 0:
                continue
            variant.reserved_quantity -= release_qty
            self.order_repo.session.add(variant)

    async def _consume_order_inventory(self, order: Order) -> None:
        items = await self.item_repo.list_by_order_id(order.id)
        for item in items:
            variant = await self.variant_repo.get_by_id(item.variant_id)
            if variant is None:
                continue
            consume_qty = min(item.quantity, variant.reserved_quantity, variant.stock_quantity)
            if consume_qty <= 0:
                continue
            variant.stock_quantity -= consume_qty
            variant.reserved_quantity -= consume_qty
            self.order_repo.session.add(variant)

    async def _lock_cart_for_user(self, user_id: UUID) -> None:
        cart = await self.order_repo.get_cart_by_user_id(user_id)
        if cart and cart.items:
            pass

