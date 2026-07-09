from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List

class CategoryBase(BaseModel):
    name: str
    slug: str
    parent_id: Optional[int] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    parent_id: Optional[int] = None

class CategoryResponse(CategoryBase):
    id: int
    
    model_config = ConfigDict(from_attributes=True)

class CategoryTreeResponse(CategoryResponse):
    children: List["CategoryTreeResponse"] = Field(default_factory=list)
