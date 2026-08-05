from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.dependencies import SessionDep, get_current_active_user
from app.models.models import User
from app.schemas.address import (
    AddressCreate,
    AddressListResponse,
    AddressResponse,
    AddressUpdate,
)
from app.services.address import (
    AddressNotFoundError,
    AddressOwnershipError,
    AddressService,
    AddressServiceError,
    AddressValidationError,
)

router = APIRouter()


def _raise_address_http_error(error: AddressServiceError) -> None:
    if isinstance(error, AddressNotFoundError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=error.detail,
        )
    if isinstance(error, AddressOwnershipError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=error.detail,
        )
    if isinstance(error, AddressValidationError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error.detail,
        )
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=error.detail,
    )


@router.post(
    "/",
    response_model=AddressResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Address",
    description="Create a new address for the authenticated user.",
    responses={
        201: {"description": "Address created successfully"},
        400: {"description": "Validation error or invalid request body"},
        401: {"description": "Unauthorized - Missing or invalid JWT token"},
    },
)
async def create_address(
    address_in: AddressCreate,
    session: SessionDep,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    service = AddressService(session)
    try:
        return await service.create_address(current_user.id, address_in)
    except AddressServiceError as error:
        _raise_address_http_error(error)


@router.get(
    "/",
    response_model=AddressListResponse,
    status_code=status.HTTP_200_OK,
    summary="List My Addresses",
    description="Retrieve all addresses belonging to the authenticated user.",
    responses={
        200: {"description": "List of user addresses returned successfully"},
        401: {"description": "Unauthorized - Missing or invalid JWT token"},
    },
)
async def list_addresses(
    session: SessionDep,
    current_user: Annotated[User, Depends(get_current_active_user)],
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
):
    service = AddressService(session)
    addresses = await service.get_user_addresses(current_user.id, skip=skip, limit=limit)
    total = await service.count_user_addresses(current_user.id)
    page = skip // limit + 1
    return AddressListResponse(items=addresses, total=total, page=page, page_size=limit, next_page=page + 1 if skip + len(addresses) < total else None)


@router.get(
    "/{address_id}",
    response_model=AddressResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Address",
    description="Retrieve details of a specific address owned by the authenticated user.",
    responses={
        200: {"description": "Address details returned successfully"},
        401: {"description": "Unauthorized - Missing or invalid JWT token"},
        403: {"description": "Forbidden - Address belongs to another user"},
        404: {"description": "Not Found - Address does not exist"},
    },
)
async def get_address(
    address_id: UUID,
    session: SessionDep,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    service = AddressService(session)
    try:
        return await service.get_address_by_id(current_user.id, address_id)
    except AddressServiceError as error:
        _raise_address_http_error(error)


@router.put(
    "/{address_id}",
    response_model=AddressResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Address",
    description="Update an existing address owned by the authenticated user.",
    responses={
        200: {"description": "Address updated successfully"},
        400: {"description": "Validation error or invalid request data"},
        401: {"description": "Unauthorized - Missing or invalid JWT token"},
        403: {"description": "Forbidden - Address belongs to another user"},
        404: {"description": "Not Found - Address does not exist"},
    },
)
async def update_address(
    address_id: UUID,
    address_in: AddressUpdate,
    session: SessionDep,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    service = AddressService(session)
    try:
        return await service.update_address(current_user.id, address_id, address_in)
    except AddressServiceError as error:
        _raise_address_http_error(error)


@router.delete(
    "/{address_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Address",
    description="Delete an address owned by the authenticated user.",
    responses={
        204: {"description": "Address deleted successfully"},
        401: {"description": "Unauthorized - Missing or invalid JWT token"},
        403: {"description": "Forbidden - Address belongs to another user"},
        404: {"description": "Not Found - Address does not exist"},
    },
)
async def delete_address(
    address_id: UUID,
    session: SessionDep,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    service = AddressService(session)
    try:
        await service.delete_address(current_user.id, address_id)
    except AddressServiceError as error:
        _raise_address_http_error(error)


@router.patch(
    "/{address_id}/default-shipping",
    response_model=AddressResponse,
    status_code=status.HTTP_200_OK,
    summary="Set Default Shipping Address",
    description="Set an address as the default shipping address for the authenticated user.",
    responses={
        200: {"description": "Default shipping address set successfully"},
        401: {"description": "Unauthorized - Missing or invalid JWT token"},
        403: {"description": "Forbidden - Address belongs to another user"},
        404: {"description": "Not Found - Address does not exist"},
    },
)
async def set_default_shipping(
    address_id: UUID,
    session: SessionDep,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    service = AddressService(session)
    try:
        return await service.set_default_shipping(current_user.id, address_id)
    except AddressServiceError as error:
        _raise_address_http_error(error)


@router.patch(
    "/{address_id}/default-billing",
    response_model=AddressResponse,
    status_code=status.HTTP_200_OK,
    summary="Set Default Billing Address",
    description="Set an address as the default billing address for the authenticated user.",
    responses={
        200: {"description": "Default billing address set successfully"},
        401: {"description": "Unauthorized - Missing or invalid JWT token"},
        403: {"description": "Forbidden - Address belongs to another user"},
        404: {"description": "Not Found - Address does not exist"},
    },
)
async def set_default_billing(
    address_id: UUID,
    session: SessionDep,
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    service = AddressService(session)
    try:
        return await service.set_default_billing(current_user.id, address_id)
    except AddressServiceError as error:
        _raise_address_http_error(error)
