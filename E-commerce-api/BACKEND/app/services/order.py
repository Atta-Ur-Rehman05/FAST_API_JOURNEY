from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Address, Order, OrderItem, OrderStatus, PaymentStatus, ProductVariant
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

    async def list_orders(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
        user_id: UUID | None = None,
    ) -> list[Order]:
        return await self.order_repo.list(skip=skip, limit=limit, user_id=user_id)

    async def create_order(self, user_id: UUID, order_in: OrderCreate) -> Order:
        """Create a zero-value draft only; clients cannot supply a total."""
        await self._validate_user_address(user_id, order_in.shipping_address_id)
        await self._validate_user_address(user_id, order_in.billing_address_id)
        order = Order(
            user_id=user_id,
            shipping_address_id=order_in.shipping_address_id,
            billing_address_id=order_in.billing_address_id,
            total_amount=0,
            order_status=OrderStatus.draft,
        )
        self.order_repo.session.add(order)
        await self.order_repo.session.commit()
        return await self.get_order(order.id)

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
        self._validate_draft(order)

        if order_in.shipping_address_id is not None:
            await self._validate_user_address(order.user_id, order_in.shipping_address_id)

        if order_in.billing_address_id is not None:
            await self._validate_user_address(order.user_id, order_in.billing_address_id)

        return await self.order_repo.update(order, order_in)

    async def delete_order(self, order_id: UUID) -> None:
        raise OrderDeletionNotAllowedError(
            "Orders are financial records and cannot be deleted; cancel an eligible order instead."
        )

    async def transition_status(self, order_id: UUID, new_status: OrderStatus) -> Order:
        order = await self.get_order(order_id)
        current_status = order.order_status
        allowed = {
            OrderStatus.draft: {OrderStatus.pending, OrderStatus.cancelled},
            OrderStatus.pending: {OrderStatus.processing, OrderStatus.cancelled},
            OrderStatus.processing: {OrderStatus.shipped, OrderStatus.cancelled},
            OrderStatus.shipped: {OrderStatus.delivered},
            OrderStatus.delivered: set(),
            OrderStatus.cancelled: set(),
        }
        if new_status not in allowed[current_status]:
            raise InvalidOrderTransitionError(
                f"Cannot transition an order from {current_status.value} to {new_status.value}."
            )

        if new_status == OrderStatus.pending and current_status == OrderStatus.draft:
            raise InvalidOrderTransitionError(
                "Draft orders cannot be submitted through this endpoint; use checkout."
            )

        if new_status == OrderStatus.cancelled:
            if order.payment and order.payment.payment_status == PaymentStatus.completed:
                raise RefundRequiredError(
                    "A completed payment must be refunded by the payment provider before cancellation."
                )
            if current_status != OrderStatus.draft:
                locked_variants = await self.variant_repo.lock_by_ids(
                    [item.variant_id for item in order.items]
                )
                for item in order.items:
                    locked_variants[item.variant_id].stock_quantity += item.quantity
                if order.payment:
                    order.payment.payment_status = PaymentStatus.failed

        order.order_status = new_status
        await self.order_repo.session.commit()
        return await self.get_order(order.id)

    async def add_item(
        self, user_id: UUID, order_id: UUID, item_in: OrderItemCreate
    ) -> OrderItem:
        order = await self.get_user_order(user_id, order_id)
        self._validate_draft(order)
        variant = await self._get_available_variant(item_in.variant_id)
        item = await self.item_repo.create(
            order,
            variant_id=variant.id,
            quantity=item_in.quantity,
            price_per_item=variant.product.base_price + variant.price_modifier,
        )
        await self.item_repo.recalculate_total(order)
        await self.order_repo.session.commit()
        return item

    async def update_item(
        self, user_id: UUID, order_id: UUID, item_id: int, item_in: OrderItemUpdate
    ) -> OrderItem:
        order = await self.get_user_order(user_id, order_id)
        self._validate_draft(order)
        item = await self._get_order_item(order, item_id)
        updated_item = await self.item_repo.update(order, item, item_in)
        await self.item_repo.recalculate_total(order)
        await self.order_repo.session.commit()
        return updated_item

    async def delete_item(self, user_id: UUID, order_id: UUID, item_id: int) -> None:
        order = await self.get_user_order(user_id, order_id)
        self._validate_draft(order)
        item = await self._get_order_item(order, item_id)
        await self.item_repo.delete(order, item)
        await self.item_repo.recalculate_total(order)
        await self.order_repo.session.commit()

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
        if quantity > variant.stock_quantity:
            raise InsufficientStockError("Requested quantity exceeds available stock.")
