from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime


class BannerBase(BaseModel):
    title: str
    image_url: str
    link_url: Optional[str] = None
    position: str = Field(default="hero", pattern="^(hero|sidebar|footer|top)$")
    is_active: bool = True
    sort_order: int = 0


class BannerCreate(BannerBase):
    pass


class BannerUpdate(BaseModel):
    title: Optional[str] = None
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    position: Optional[str] = Field(default=None, pattern="^(hero|sidebar|footer|top)$")
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class BannerResponse(BannerBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
