# this file contain schemas for database mean data validation

from pydantic import BaseModel

# input schema
class create_blogs(BaseModel):

    title: str
    content: str
    

# output schema
class blog_response(BaseModel):
    id: int
    title: str
    content: str
    
    class Config:
        from_attributes = True
