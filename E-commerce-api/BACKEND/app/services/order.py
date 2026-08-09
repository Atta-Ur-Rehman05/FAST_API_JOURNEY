#  this file is for order management logic 

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


class OrderServiceError(Exception):    # this is base class for all order related exceptions
    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)


class OrderNotFoundError(OrderServiceError):   # this is for order not found
    pass


class OrderItemNotFoundError(OrderServiceError):  # this is for order item not found
    pass


class OrderOwnershipError(OrderServiceError):  # this is for order ownership
    pass


class OrderItemOwnershipError(OrderServiceError):  # this is for order item ownership
    pass


class AddressNotFoundError(OrderServiceError):  # this is for address not found
    pass


class AddressOwnershipError(OrderServiceError):  # this is for address ownership
    pass


class ProductVariantNotFoundError(OrderServiceError):  # this is for product variant not found
    pass


class ProductUnavailableError(OrderServiceError):  # this is for product unavailable
    pass


class InsufficientStockError(OrderServiceError):  # this is for insufficient stock
    pass


class OrderNotEditableError(OrderServiceError):  # this is for order not editable
    pass


class InvalidOrderTransitionError(OrderServiceError):  # this is for invalid order transition
    pass


class RefundRequiredError(OrderServiceError):  # this is for refund required
    pass


class OrderDeletionNotAllowedError(OrderServiceError):  # this is for order deletion not allowed
    pass


class OrderService:
    def __init__(self, session: AsyncSession):  # initialize the order service with the session
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
        return await self.order_repo.list(skip=skip, limit=limit, user_id=user_id)   # list all orders

    async def create_order(self, user_id: UUID, order_in: OrderCreate) -> Order:     # create an order
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
        try:
            self.order_repo.session.add(order)
            await self.order_repo.session.commit()
        except Exception:
            await self.order_repo.session.rollback()
            raise
        return await self.get_order(order.id)

    async def count_orders(self, *, user_id: UUID | None = None) -> int:      # count orders
        return await self.order_repo.count(user_id=user_id)

    async def get_order(self, order_id: UUID) -> Order:     # get order by id
        order = await self.order_repo.get_by_id(order_id)
        if order is None:
            raise OrderNotFoundError("Order not found.")
        return order

    async def get_user_order(self, user_id: UUID, order_id: UUID) -> Order:     # get user order by id
        order = await self.get_order(order_id)
        self._validate_order_owner(order, user_id)
        return order

    async def update_order(self, order_id: UUID, order_in: OrderUpdate) -> Order:     # update order
        order = await self.get_order(order_id)
        self._validate_draft(order)

        if order_in.shipping_address_id is not None:
            await self._validate_user_address(order.user_id, order_in.shipping_address_id)

        if order_in.billing_address_id is not None:
            await self._validate_user_address(order.user_id, order_in.billing_address_id)

        try:
            return await self.order_repo.update(order, order_in)
        except Exception:
            await self.order_repo.session.rollback()
            raise

    async def delete_order(self, order_id: UUID) -> None:     # delete order
        raise OrderDeletionNotAllowedError(
            "Orders are financial records and cannot be deleted; cancel an eligible order instead."
        )

    async def transition_status(self, order_id: UUID, new_status: OrderStatus) -> Order:     # transition order status
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

        try:
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
                        variant = locked_variants[item.variant_id]
                        # Prevent underflow if reserved_quantity < item.quantity
                        if variant.reserved_quantity < item.quantity:
                            variant.reserved_quantity = 0
                        else:
                            variant.reserved_quantity -= item.quantity
                    if order.payment:
                        order.payment.payment_status = PaymentStatus.failed

            if new_status == OrderStatus.delivered:
                locked_variants = await self.variant_repo.lock_by_ids(
                    [item.variant_id for item in order.items]
                )
                for item in order.items:
                    variant = locked_variants[item.variant_id]
                    # Validate stock and reserved quantities before mutating
                    if variant.stock_quantity < item.quantity:
                        raise InsufficientStockError(
                            f"Cannot deliver order: stock quantity for variant {variant.id} is insufficient."
                        )
                    if variant.reserved_quantity < item.quantity:
                        variant.reserved_quantity = item.quantity

                    variant.stock_quantity -= item.quantity
                    variant.reserved_quantity -= item.quantity

            order.order_status = new_status
            await self.order_repo.session.commit()
            return await self.get_order(order.id)
        except (OrderServiceError, Exception):
            await self.order_repo.session.rollback()
            raise

    async def add_item(         # add item to order
        self, user_id: UUID, order_id: UUID, item_in: OrderItemCreate
    ) -> OrderItem:
        order = await self.get_user_order(user_id, order_id)
        self._validate_draft(order)
        variant = await self._get_available_variant(item_in.variant_id)

        # Check if item already exists in the draft order to calculate total requested quantity
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

    async def update_item(        # update item in order
        self, user_id: UUID, order_id: UUID, item_id: int, item_in: OrderItemUpdate
    ) -> OrderItem:
        order = await self.get_user_order(user_id, order_id)
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
        order = await self.get_user_order(user_id, order_id)
        self._validate_draft(order)
        item = await self._get_order_item(order, item_id)
        try:
            await self.item_repo.delete(order, item)
            await self.item_repo.recalculate_total(order)
            await self.order_repo.session.commit()
        except Exception:
            await self.order_repo.session.rollback()
            raise

    async def _validate_user_address(self, user_id: UUID, address_id: UUID) -> Address:     # validate user address
        address = await self.address_repo.get_by_id(address_id)
        if address is None:
            raise AddressNotFoundError("Address not found.")

        if address.user_id != user_id:
            raise AddressOwnershipError("Address does not belong to this user.")

        return address

    def _validate_order_owner(self, order: Order, user_id: UUID) -> None:    # validate order owner
        if order.user_id != user_id:
            raise OrderOwnershipError("Order does not belong to this user.")

    def _validate_draft(self, order: Order) -> None:    # validate draft
        if order.order_status != OrderStatus.draft:
            raise OrderNotEditableError("Only draft orders can be modified.")

    async def _get_order_item(self, order: Order, item_id: int) -> OrderItem:    # get order item by id 
        item = await self.item_repo.get_by_id(item_id)
        if item is None:
            raise OrderItemNotFoundError("Order item not found.")

        if item.order_id != order.id:
            raise OrderItemOwnershipError("Order item does not belong to this order.")

        return item

    async def _get_available_variant(self, variant_id: UUID) -> ProductVariant:    # get available variant
        variant = await self.variant_repo.get_by_id(variant_id)
        if variant is None:
            raise ProductVariantNotFoundError("Product variant not found.")

        if not variant.product or not variant.product.is_active:
            raise ProductUnavailableError("Product is not available.")

        return variant

    def _validate_stock(self, variant: ProductVariant, quantity: int) -> None:    # validate stock
        available_stock = variant.stock_quantity - variant.reserved_quantity
        if quantity > available_stock:
            raise InsufficientStockError("Requested quantity exceeds available stock.")
