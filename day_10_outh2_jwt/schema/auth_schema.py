from pydantic import BaseModel

class user(BaseModel):
    username: str
    password: str
    

class token(BaseModel):
    access_token: str
    token_type: str