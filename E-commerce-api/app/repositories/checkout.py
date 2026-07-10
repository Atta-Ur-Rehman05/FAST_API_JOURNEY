from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.models import (
    Address,
    Cart,
    CartItem,
    Order,
    OrderItem,
    OrderStatus,
    Payment,
    PaymentStatus,
    ProductVariant,
)
from app.schemas.checkout import CheckoutCreate


class CheckoutRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_cart_for_checkout(self, user_id: UUID) -> Optional[Cart]:
        result = await self.session.execute(
            select(Cart)
            .where(Cart.user_id == user_id)
            .options(
                selectinload(Cart.items)
                .selectinload(CartItem.variant)
                .selectinload(ProductVariant.product)
            )
        )
        return result.scalars().first()

    async def get_address_by_id(self, address_id: UUID) -> Optional[Address]:
        result = await self.session.execute(
            select(Address).where(Address.id == address_id)
        )
        return result.scalars().first()

    async def create_checkout_order(
        self,
        *,
        user_id: UUID,
        cart: Cart,
        checkout_in: CheckoutCreate,
        total_amount: Decimal,
    ) -> tuple[Order, Payment]:
        order = Order(
            user_id=user_id,
            shipping_address_id=checkout_in.shipping_address_id,
            billing_address_id=checkout_in.billing_address_id,
            total_amount=total_amount,
            order_status=OrderStatus.pending,
        )
        self.session.add(order)
        await self.session.flush()

        for cart_item in cart.items:
            variant = cart_item.variant
            unit_price = variant.product.base_price + variant.price_modifier
            order_item = OrderItem(
                order_id=order.id,
                variant_id=cart_item.variant_id,
                quantity=cart_item.quantity,
                price_per_item=unit_price,
            )
            variant.stock_quantity -= cart_item.quantity
            self.session.add(order_item)
            self.session.add(variant)
            await self.session.delete(cart_item)

        cart.updated_at = datetime.utcnow()
        payment = Payment(
            order_id=order.id,
            payment_method=checkout_in.payment_method,
            transaction_id=checkout_in.transaction_id,
            amount=total_amount,
            payment_status=PaymentStatus.pending,
        )
        self.session.add(cart)
        self.session.add(payment)

        await self.session.commit()
        await self.session.refresh(payment)
        return await self.get_order_by_id(order.id), payment

    async def get_order_by_id(self, order_id: UUID) -> Order:
        result = await self.session.execute(
            select(Order)
            .where(Order.id == order_id)
            .options(selectinload(Order.items))
        )
        return result.scalars().one()
