from fastapi import APIRouter, Depends
from typing import Annotated
from app.models.models import User
from app.schemas.user import UserResponse
from app.api.dependencies import get_current_active_user

router = APIRouter()

@router.get("/me", response_model=UserResponse)
async def read_users_me(
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return current_user
