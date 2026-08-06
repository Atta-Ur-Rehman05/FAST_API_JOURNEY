# this file contain the address repo stuffs

from typing import List, Optional
from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Address
from app.schemas.address import AddressCreate, AddressUpdate
from app.core.time import utc_now


class AddressRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def _reset_default_shipping(self, user_id: UUID, exclude_id: Optional[UUID] = None) -> None:
        stmt = (
            update(Address)
            .where(Address.user_id == user_id, Address.is_default_shipping == True)
        )
        if exclude_id:
            stmt = stmt.where(Address.id != exclude_id)
        stmt = stmt.values(is_default_shipping=False)
        await self.session.execute(stmt)

    async def _reset_default_billing(self, user_id: UUID, exclude_id: Optional[UUID] = None) -> None:
        stmt = (
            update(Address)
            .where(Address.user_id == user_id, Address.is_default_billing == True)
        )
        if exclude_id:
            stmt = stmt.where(Address.id != exclude_id)
        stmt = stmt.values(is_default_billing=False)
        await self.session.execute(stmt)

    async def create_address(self, user_id: UUID, address_in: AddressCreate) -> Address:
        if address_in.is_default_shipping:
            await self._reset_default_shipping(user_id)
        if address_in.is_default_billing:
            await self._reset_default_billing(user_id)

        address = Address(
            **address_in.model_dump(),
            user_id=user_id
        )
        self.session.add(address)
        await self.session.commit()
        await self.session.refresh(address)
        return address

    async def get_address(self, address_id: UUID) -> Optional[Address]:
        result = await self.session.execute(
            select(Address).where(Address.id == address_id)
        )
        return result.scalars().first()

    async def get_user_addresses(self, user_id: UUID, *, skip: int = 0, limit: int = 100) -> List[Address]:
        result = await self.session.execute(
            select(Address)
            .where(Address.user_id == user_id)
            .order_by(Address.created_at.desc())
            .offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def count_user_addresses(self, user_id: UUID) -> int:
        return (await self.session.execute(select(func.count(Address.id)).where(Address.user_id == user_id))).scalar_one()

    async def update_address(self, address: Address, address_in: AddressUpdate) -> Address:
        update_data = address_in.model_dump(exclude_unset=True)

        if update_data.get("is_default_shipping") is True:
            await self._reset_default_shipping(address.user_id, exclude_id=address.id)
        if update_data.get("is_default_billing") is True:
            await self._reset_default_billing(address.user_id, exclude_id=address.id)

        for field, value in update_data.items():
            setattr(address, field, value)

        address.updated_at = utc_now()
        self.session.add(address)
        await self.session.commit()
        await self.session.refresh(address)
        return address

    async def delete_address(self, address: Address) -> None:
        await self.session.delete(address)
        await self.session.commit()

    async def set_default_shipping(self, user_id: UUID, address_id: UUID) -> Optional[Address]:
        address = await self.get_address(address_id)
        if not address:
            return None

        await self._reset_default_shipping(user_id, exclude_id=address_id)
        address.is_default_shipping = True
        address.updated_at = utc_now()
        self.session.add(address)
        await self.session.commit()
        await self.session.refresh(address)
        return address

    async def set_default_billing(self, user_id: UUID, address_id: UUID) -> Optional[Address]:
        address = await self.get_address(address_id)
        if not address:
            return None

        await self._reset_default_billing(user_id, exclude_id=address_id)
        address.is_default_billing = True
        address.updated_at = utc_now()
        self.session.add(address)
        await self.session.commit()
        await self.session.refresh(address)
        return address
