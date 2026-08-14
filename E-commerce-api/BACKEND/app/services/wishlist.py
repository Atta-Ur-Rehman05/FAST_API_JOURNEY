from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Wishlist, WishlistItem
from app.repositories.wishlist import WishlistRepository


class WishlistServiceError(Exception):
    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)


class WishlistNotFoundError(WishlistServiceError):
    pass


class WishlistItemNotFoundError(WishlistServiceError):
    pass


class DuplicateWishlistItemError(WishlistServiceError):
    pass


class ProductNotFoundError(WishlistServiceError):
    pass


class WishlistService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = WishlistRepository(session)

    async def get_user_wishlist(self, user_id: UUID) -> Wishlist:
        return await self.repo.get_or_create_wishlist(user_id)

    async def list_items(self, user_id: UUID) -> list[WishlistItem]:
        wishlist = await self.repo.get_or_create_wishlist(user_id)
        return await self.repo.list_items(wishlist.id)

    async def add_item(self, user_id: UUID, product_id: UUID) -> WishlistItem:
        wishlist = await self.repo.get_or_create_wishlist(user_id)
        existing = await self.repo.get_item(wishlist.id, product_id)
        if existing:
            raise DuplicateWishlistItemError("Product is already in your wishlist.")
        return await self.repo.add_item(wishlist.id, product_id)

    async def remove_item(self, user_id: UUID, product_id: UUID) -> None:
        wishlist = await self.repo.get_by_user_id(user_id)
        if wishlist is None:
            raise WishlistNotFoundError("Wishlist not found.")
        item = await self.repo.get_item(wishlist.id, product_id)
        if item is None:
            raise WishlistItemNotFoundError("Wishlist item not found.")
        await self.repo.delete_item(item)

    async def clear_wishlist(self, user_id: UUID) -> None:
        wishlist = await self.repo.get_by_user_id(user_id)
        if wishlist is None:
            raise WishlistNotFoundError("Wishlist not found.")
        await self.repo.clear_wishlist(wishlist.id)
