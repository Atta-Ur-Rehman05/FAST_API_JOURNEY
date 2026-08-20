from typing import Optional
from uuid import UUID

from sqlalchemy import func, select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.models import Address, Cart, Order, OrderItem, ProductVariant, User
from app.schemas.order import OrderCreate, OrderItemCreate, OrderItemUpdate
from app.core.time import utc_now


class OrderRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, order_id: UUID) -> Optional[Order]:
        result = await self.session.execute(
            select(Order)
            .where(Order.id == order_id)
            .options(selectinload(Order.user), selectinload(Order.items).selectinload(OrderItem.variant).selectinload(ProductVariant.product), selectinload(Order.payment), selectinload(Order.shipping_address), selectinload(Order.billing_address))
        )
        return result.scalars().first()

    async def get_by_id_for_update(self, order_id: UUID) -> Optional[Order]:
        result = await self.session.execute(
            select(Order)
            .where(Order.id == order_id)
            .with_for_update()
            .options(selectinload(Order.user), selectinload(Order.items).selectinload(OrderItem.variant).selectinload(ProductVariant.product), selectinload(Order.payment), selectinload(Order.shipping_address), selectinload(Order.billing_address))
        )
        return result.scalars().first()

    async def list(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
        user_id: Optional[UUID] = None,
        search: Optional[str] = None,
    ) -> list[Order]:
        stmt = (
            select(Order)
            .options(selectinload(Order.user), selectinload(Order.items).selectinload(OrderItem.variant).selectinload(ProductVariant.product), selectinload(Order.payment), selectinload(Order.shipping_address), selectinload(Order.billing_address))
            .order_by(Order.created_at.desc())
            .offset(skip)
            .limit(limit)
        )

        if user_id is not None:
            stmt = stmt.where(Order.user_id == user_id)

        if search:
            stmt = stmt.where(Order.id.ilike(f"%{search}%"))

        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def count(self, *, user_id: Optional[UUID] = None, search: Optional[str] = None) -> int:
        stmt = select(func.count(Order.id))
        if user_id is not None: stmt = stmt.where(Order.user_id == user_id)
        if search: stmt = stmt.where(Order.id.ilike(f"%{search}%"))
        return (await self.session.execute(stmt)).scalar_one()

    async def get_address_by_id(self, address_id: UUID) -> Optional[Address]:
        result = await self.session.execute(
            select(Address).where(Address.id == address_id)
        )
        return result.scalars().first()

    async def get_cart_by_user_id(self, user_id: UUID) -> Optional[Cart]:
        result = await self.session.execute(
            select(Cart).where(Cart.user_id == user_id)
        )
        return result.scalars().first()


class OrderItemRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, item_id: int) -> Optional[OrderItem]:
        result = await self.session.execute(
            select(OrderItem).where(OrderItem.id == item_id)
        )
        return result.scalars().first()

    async def list_by_order_id(self, order_id: UUID) -> list[OrderItem]:
        result = await self.session.execute(
            select(OrderItem).where(OrderItem.order_id == order_id)
        )
        return list(result.scalars().all())

    async def delete_by_order_id(self, order_id: UUID) -> None:
        await self.session.execute(delete(OrderItem).where(OrderItem.order_id == order_id))

    async def create(
        self, order: Order, *, variant_id: UUID, quantity: int, price_per_item
    ) -> OrderItem:
        item = OrderItem(
            order_id=order.id,
            variant_id=variant_id,
            quantity=quantity,
            price_per_item=price_per_item,
        )
        order.updated_at = utc_now()
        self.session.add(order)
        self.session.add(item)
        await self.session.flush()
        return item

    async def update(self, order: Order, item: OrderItem, item_in: OrderItemUpdate) -> OrderItem:
        update_data = item_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(item, field, value)

        order.updated_at = utc_now()
        self.session.add(order)
        self.session.add(item)
        await self.session.flush()
        return item

    async def delete(self, order: Order, item: OrderItem) -> None:
        order.updated_at = utc_now()
        self.session.add(order)
        await self.session.delete(item)
        await self.session.flush()

    async def recalculate_total(self, order: Order) -> None:
        result = await self.session.execute(
            select(func.coalesce(func.sum(OrderItem.quantity * OrderItem.price_per_item), 0))
            .where(OrderItem.order_id == order.id)
        )
        order.total_amount = result.scalar_one()
        order.updated_at = utc_now()
        await self.session.flush()


class OrderAddressRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, address_id: UUID) -> Optional[Address]:
        result = await self.session.execute(
            select(Address).where(Address.id == address_id)
        )
        return result.scalars().first()


class OrderProductVariantRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, variant_id: UUID) -> Optional[ProductVariant]:
        result = await self.session.execute(
            select(ProductVariant)
            .where(ProductVariant.id == variant_id)
            .options(selectinload(ProductVariant.product))
        )
        return result.scalars().first()

    async def lock_by_ids(self, variant_ids: list[UUID]) -> dict[UUID, ProductVariant]:
        if not variant_ids:
            return {}
        result = await self.session.execute(
            select(ProductVariant)
            .where(ProductVariant.id.in_(variant_ids))
            .order_by(ProductVariant.id)
            .with_for_update()
        )
        variants = result.scalars().all()
        return {variant.id: variant for variant in variants}

