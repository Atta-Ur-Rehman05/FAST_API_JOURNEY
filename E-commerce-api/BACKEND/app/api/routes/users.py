from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import Annotated, Optional
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.api.dependencies import SessionDep, get_current_active_user, get_current_admin_user
from app.models.models import User, RoleType
from app.repositories.user import UserRepository
from app.schemas.pagination import PaginatedResponse
from app.schemas.user import UserResponse, UserUpdate

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def read_users_me(
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return current_user


@router.get("/", response_model=PaginatedResponse[UserResponse])
async def list_users(
    session: SessionDep,
    _: Annotated[User, Depends(get_current_admin_user)],
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
    search: Optional[str] = None,
):
    user_repo = UserRepository(session)
    stmt = select(User)
    if search:
        stmt = stmt.where(User.email.ilike(f"%{search}%"))

    count_stmt = select(func.count(User.id))
    if search:
        count_stmt = count_stmt.where(User.email.ilike(f"%{search}%"))
    total = (await session.execute(count_stmt)).scalar_one()

    result = await session.execute(stmt.offset(skip).limit(limit).order_by(User.created_at.desc()))
    items = list(result.scalars().all())
    return PaginatedResponse.create(items=items, total=total, skip=skip, limit=limit)


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    user_in: UserUpdate,
    session: SessionDep,
    _: Annotated[User, Depends(get_current_admin_user)],
):
    user_repo = UserRepository(session)
    user = await user_repo.get_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    try:
        updated = await user_repo.update(user, user_in)
        await session.commit()
        await session.refresh(updated)
        return updated
    except Exception:
        await session.rollback()
        raise
