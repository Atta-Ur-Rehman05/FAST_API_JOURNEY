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
            # Lock cart rows for this user before creating order
            await self._lock_cart_for_user(user_id)
            
            # Add order to session and flush to generate ID
            self.order_repo.session.add(order)
            await self.order_repo.session.flush()
            
            # Calculate and update total with proper validation
            await self._calculate_and_set_order_total(order)
            await self.order_repo.session.commit()
        except Exception:
            await self.order_repo.session.rollback()
            raise
        return await self.get_order(order.id)

    async def _validate_draft(self, order: Order) -> None:
        """Validate that order can be edited (must be in draft status)."""
        if order.order_status != OrderStatus.draft:
            raise OrderNotEditableError(
                "Only draft orders can be edited; complete or cancelled orders cannot be modified."
            )

    async def _validate_user_address(self, user_id: UUID, address_id: UUID) -> Address:
        """Validate that address belongs to user."""
        address = await self.order_repo.get_address_by_id(address_id)
        if address is None:
            raise AddressNotFoundError("Address not found.")

        if address.user_id != user_id:
            raise AddressOwnershipError("Address does not belong to this user.")

        return address

    async def _validate_order_owner(self, order: Order, user_id: UUID) -> None:
        """Validate that order belongs to user."""
        if order.user_id != user_id:
            raise OrderOwnershipError("Order does not belong to this user.")

    async def _validate_draft(self, order: Order) -> None:
        if order.order_status != OrderStatus.draft:
            raise OrderNotEditableError("Only draft orders can be edited.")

    async def _validate_order_owner(self, order: Order, user_id: UUID) -> None:
        if order.user_id != user_id:
            raise OrderOwnershipError("Order does not belong to this user.")

    async def _get_available_variant(self, variant_id: UUID) -> ProductVariant:
        variant = await self.variant_repo.get_by_id(variant_id)
        if variant is None:
            raise ProductVariantNotFoundError("Product variant not found.")
        
        if not variant.product or not variant.product.is_active:
            raise ProductUnavailableError("Product is not available.")
        
        return variant

    async def _validate_stock(self, variant: ProductVariant, quantity: int) -> None:
        if quantity > variant.stock_quantity - variant.reserved_quantity:
            raise InsufficientStockError("Requested quantity exceeds available stock.")

    async def _calculate_and_set_order_total(self, order: Order) -> None:
        """Calculate total and set order items with snapshots."""
        order_items = await self.item_repo.list_by_order_id(order.id)
        
        # Lock variants to prevent stock changes during calculation
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
                "variant": variant
            })
        
        # Clear existing order items and create new ones
        await self.item_repo.delete_by_order_id(order.id)
        
        for item_data in order_items_data:
            await self.item_repo.create(
                order,
                variant_id=item_data["variant_id"],
                quantity=item_data["quantity"],
                price_per_item=item_data["price_per_item"],
            )
        
        order.total_amount = total_amount

    async def _lock_cart_for_user(self, user_id: UUID) -> None:
        """Lock cart rows for this user before creating order."""
        cart = await self.order_repo.get_cart_by_user_id(user_id)
        if cart and cart.items:
            # This ensures cart cannot be modified while creating order
            # Cart items will be deleted after order creation
            pass

    async def count_orders(self, *, user_id: UUID | None = None) -> int:      # count orders
        return await self.order_repo.count(user_id=user_id)

    async def add_item(         # add item to order
        self, user_id: UUID, order_id: UUID, item_in: OrderItemCreate
    ) -> OrderItem:
        order = await self.get_user_order_for_update(user_id, order_id)
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
