from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime


class BlogBase(BaseModel):
    title: str
    slug: str
    excerpt: Optional[str] = None
    content: str
    cover_image_url: Optional[str] = None
    author_name: Optional[str] = None
    is_published: bool = False
    published_at: Optional[datetime] = None


class BlogCreate(BlogBase):
    pass


class BlogUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    excerpt: Optional[str] = None
    content: Optional[str] = None
    cover_image_url: Optional[str] = None
    author_name: Optional[str] = None
    is_published: Optional[bool] = None
    published_at: Optional[datetime] = None


class BlogResponse(BlogBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
