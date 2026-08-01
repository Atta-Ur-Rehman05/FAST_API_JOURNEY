from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Address
from app.repositories.address import AddressRepository
from app.schemas.address import AddressCreate, AddressUpdate


class AddressServiceError(Exception):
    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)


class AddressNotFoundError(AddressServiceError):
    def __init__(self, detail: str = "Address not found"):
        super().__init__(detail)


class AddressOwnershipError(AddressServiceError):
    def __init__(self, detail: str = "You do not have permission to access this address"):
        super().__init__(detail)


class AddressValidationError(AddressServiceError):
    def __init__(self, detail: str = "Invalid address data"):
        super().__init__(detail)


class AddressService:
    def __init__(self, session: AsyncSession, address_repo: Optional[AddressRepository] = None):
        self.session = session
        self.address_repo = address_repo or AddressRepository(session)

    async def _get_address_and_check_ownership(self, user_id: UUID, address_id: UUID) -> Address:
        address = await self.address_repo.get_address(address_id)
        if not address:
            raise AddressNotFoundError("Address not found")
        if address.user_id != user_id:
            raise AddressOwnershipError("You do not have permission to access this address")
        return address

    async def create_address(self, user_id: UUID, address_in: AddressCreate) -> Address:
        return await self.address_repo.create_address(user_id, address_in)

    async def get_user_addresses(self, user_id: UUID) -> List[Address]:
        return await self.address_repo.get_user_addresses(user_id)

    async def get_address_by_id(self, user_id: UUID, address_id: UUID) -> Address:
        return await self._get_address_and_check_ownership(user_id, address_id)

    async def update_address(
        self, user_id: UUID, address_id: UUID, address_in: AddressUpdate
    ) -> Address:
        address = await self._get_address_and_check_ownership(user_id, address_id)
        return await self.address_repo.update_address(address, address_in)

    async def delete_address(self, user_id: UUID, address_id: UUID) -> None:
        address = await self._get_address_and_check_ownership(user_id, address_id)
        await self.address_repo.delete_address(address)

    async def set_default_shipping(self, user_id: UUID, address_id: UUID) -> Address:
        await self._get_address_and_check_ownership(user_id, address_id)
        updated_address = await self.address_repo.set_default_shipping(user_id, address_id)
        if not updated_address:
            raise AddressNotFoundError("Address not found")
        return updated_address

    async def set_default_billing(self, user_id: UUID, address_id: UUID) -> Address:
        await self._get_address_and_check_ownership(user_id, address_id)
        updated_address = await self.address_repo.set_default_billing(user_id, address_id)
        if not updated_address:
            raise AddressNotFoundError("Address not found")
        return updated_address
