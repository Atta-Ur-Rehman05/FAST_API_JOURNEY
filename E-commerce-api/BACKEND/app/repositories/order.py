from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.models import Address, Order, OrderItem, ProductVariant
from app.schemas.order import OrderCreate, OrderItemCreate, OrderItemUpdate, OrderUpdate


class OrderRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, order_id: UUID) -> Optional[Order]:
        result = await self.session.execute(
            select(Order)
            .where(Order.id == order_id)
            .options(selectinload(Order.items))
        )
        return result.scalars().first()

    async def list(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
        user_id: Optional[UUID] = None,
    ) -> list[Order]:
        stmt = (
            select(Order)
            .options(selectinload(Order.items))
            .order_by(Order.created_at.desc())
            .offset(skip)
            .limit(limit)
        )

        if user_id is not None:
            stmt = stmt.where(Order.user_id == user_id)

        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create(self, user_id: UUID, order_in: OrderCreate) -> Order:
        order = Order(user_id=user_id, **order_in.model_dump())
        self.session.add(order)
        await self.session.commit()
        return await self.get_by_id(order.id)

    async def update(self, order: Order, order_in: OrderUpdate) -> Order:
        update_data = order_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(order, field, value)

        order.updated_at = datetime.utcnow()
        self.session.add(order)
        await self.session.commit()
        return await self.get_by_id(order.id)

    async def delete(self, order: Order) -> None:
        await self.session.delete(order)
        await self.session.commit()


class OrderItemRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, item_id: int) -> Optional[OrderItem]:
        result = await self.session.execute(
            select(OrderItem).where(OrderItem.id == item_id)
        )
        return result.scalars().first()

    async def create(self, order: Order, item_in: OrderItemCreate) -> OrderItem:
        item = OrderItem(order_id=order.id, **item_in.model_dump())
        order.updated_at = datetime.utcnow()
        self.session.add(order)
        self.session.add(item)
        await self.session.commit()
        await self.session.refresh(item)
        return item

    async def update(self, order: Order, item: OrderItem, item_in: OrderItemUpdate) -> OrderItem:
        update_data = item_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(item, field, value)

        order.updated_at = datetime.utcnow()
        self.session.add(order)
        self.session.add(item)
        await self.session.commit()
        await self.session.refresh(item)
        return item

    async def delete(self, order: Order, item: OrderItem) -> None:
        order.updated_at = datetime.utcnow()
        self.session.add(order)
        await self.session.delete(item)
        await self.session.commit()


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
