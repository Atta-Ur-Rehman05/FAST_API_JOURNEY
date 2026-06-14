from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# User Schemas
class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True

# Favorite City Schemas
class FavoriteCityBase(BaseModel):
    city: str

class FavoriteCityCreate(FavoriteCityBase):
    pass

class FavoriteCityResponse(FavoriteCityBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

# Search History Schemas
class SearchHistoryBase(BaseModel):
    city: str

class SearchHistoryResponse(SearchHistoryBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
