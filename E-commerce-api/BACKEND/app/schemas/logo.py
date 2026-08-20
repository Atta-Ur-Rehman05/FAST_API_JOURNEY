from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime


class SiteLogoBase(BaseModel):
    logo_url: str
    favicon_url: Optional[str] = None


class SiteLogoCreate(SiteLogoBase):
    pass


class SiteLogoUpdate(BaseModel):
    logo_url: Optional[str] = None
    favicon_url: Optional[str] = None


class SiteLogoResponse(SiteLogoBase):
    id: int
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
