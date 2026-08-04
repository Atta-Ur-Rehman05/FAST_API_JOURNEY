from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.models import Cart, CartItem, ProductVariant
from app.schemas.cart import CartItemCreate


class CartRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, cart_id: UUID) -> Optional[Cart]:
        result = await self.session.execute(
            select(Cart).where(Cart.id == cart_id).options(selectinload(Cart.items))
        )
        return result.scalars().first()

    async def get_by_user_id(self, user_id: UUID) -> Optional[Cart]:
        result = await self.session.execute(
            select(Cart).where(Cart.user_id == user_id).options(selectinload(Cart.items))
        )
        return result.scalars().first()

    async def create_for_user(self, user_id: UUID) -> Cart:
        cart = Cart(user_id=user_id)
        self.session.add(cart)
        await self.session.commit()
        return await self.get_by_id(cart.id)

    async def get_item_by_id(self, item_id: int) -> Optional[CartItem]:
        result = await self.session.execute(
            select(CartItem).where(CartItem.id == item_id)
        )
        return result.scalars().first()

    async def get_item_by_cart_and_variant(
        self, cart_id: UUID, variant_id: UUID
    ) -> Optional[CartItem]:
        result = await self.session.execute(
            select(CartItem).where(
                CartItem.cart_id == cart_id,
                CartItem.variant_id == variant_id,
            )
        )
        return result.scalars().first()

    async def add_item(self, cart: Cart, item_in: CartItemCreate) -> CartItem:
        item = CartItem(
            cart_id=cart.id,
            variant_id=item_in.variant_id,
            quantity=item_in.quantity,
        )
        cart.updated_at = datetime.utcnow()
        self.session.add(cart)
        self.session.add(item)
        await self.session.commit()
        await self.session.refresh(item)
        return item

    async def update_item_quantity(self, cart: Cart, item: CartItem, quantity: int) -> CartItem:
        item.quantity = quantity
        cart.updated_at = datetime.utcnow()
        self.session.add(cart)
        self.session.add(item)
        await self.session.commit()
        await self.session.refresh(item)
        return item

    async def delete_item(self, cart: Cart, item: CartItem) -> None:
        cart.updated_at = datetime.utcnow()
        self.session.add(cart)
        await self.session.delete(item)
        await self.session.commit()

    async def clear_items(self, cart: Cart) -> None:
        result = await self.session.execute(
            select(CartItem).where(CartItem.cart_id == cart.id)
        )
        for item in result.scalars().all():
            await self.session.delete(item)

        cart.updated_at = datetime.utcnow()
        self.session.add(cart)
        await self.session.commit()


class CartProductVariantRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, variant_id: UUID) -> Optional[ProductVariant]:
        result = await self.session.execute(
            select(ProductVariant)
            .where(ProductVariant.id == variant_id)
            .options(selectinload(ProductVariant.product))
        )
        return result.scalars().first()
