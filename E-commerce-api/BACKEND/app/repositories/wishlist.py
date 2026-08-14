from typing import Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.models import Wishlist, WishlistItem, Product


class WishlistRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_user_id(self, user_id: UUID) -> Optional[Wishlist]:
        result = await self.session.execute(
            select(Wishlist).where(Wishlist.user_id == user_id).options(selectinload(Wishlist.items).selectinload(WishlistItem.product))
        )
        return result.scalars().first()

    async def get_or_create_wishlist(self, user_id: UUID) -> Wishlist:
        wishlist = await self.get_by_user_id(user_id)
        if wishlist is None:
            wishlist = Wishlist(user_id=user_id)
            self.session.add(wishlist)
            await self.session.flush()
            await self.session.refresh(wishlist)
        return wishlist

    async def get_item(self, wishlist_id: UUID, product_id: UUID) -> Optional[WishlistItem]:
        result = await self.session.execute(
            select(WishlistItem).where(WishlistItem.wishlist_id == wishlist_id, WishlistItem.product_id == product_id).options(selectinload(WishlistItem.product))
        )
        return result.scalars().first()

    async def list_items(self, wishlist_id: UUID) -> list[WishlistItem]:
        result = await self.session.execute(
            select(WishlistItem).where(WishlistItem.wishlist_id == wishlist_id).options(selectinload(WishlistItem.product)).order_by(WishlistItem.created_at.desc())
        )
        return list(result.scalars().all())

    async def add_item(self, wishlist_id: UUID, product_id: UUID) -> WishlistItem:
        item = WishlistItem(wishlist_id=wishlist_id, product_id=product_id)
        self.session.add(item)
        await self.session.flush()
        await self.session.refresh(item)
        return item

    async def delete_item(self, item: WishlistItem) -> None:
        await self.session.delete(item)
        await self.session.flush()

    async def clear_wishlist(self, wishlist_id: UUID) -> None:
        await self.session.execute(
            select(WishlistItem).where(WishlistItem.wishlist_id == wishlist_id)
        )
        items = (await self.session.execute(select(WishlistItem.id).where(WishlistItem.wishlist_id == wishlist_id))).scalars().all()
        if items:
            await self.session.execute(select(WishlistItem).where(WishlistItem.wishlist_id == wishlist_id).delete(synchronize_session=False))
            await self.session.flush()
