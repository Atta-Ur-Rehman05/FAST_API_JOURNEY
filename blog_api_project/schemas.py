# this file contain schemas for database mean data validation

from pydantic import BaseModel

# input schema
class create_blogs(BaseModel):

    title: str
    content: str
    
class user_create(BaseModel):
    username: str
    password: str

class user_response(BaseModel):
    id: int
    username: str
    
    class Config:
        from_attributes = True


# output schema
class blog_response(BaseModel):
    id: int
    title: str
    content: str
    owner_id: int
    
    class Config:
        from_attributes = True
