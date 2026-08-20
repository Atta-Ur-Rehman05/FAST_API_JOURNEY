from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime


class HomeSlideBase(BaseModel):
    title: str
    subtitle: Optional[str] = None
    image_url: str
    link_url: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0


class HomeSlideCreate(HomeSlideBase):
    pass


class HomeSlideUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class HomeSlideResponse(HomeSlideBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
