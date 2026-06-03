# Response Models in FastAPI
# Response Models
# hide sensitive data
# customize response
# exclude fields
# output formats


from fastapi import FastAPI
from pydantic import BaseModel



app = FastAPI()


class Address(BaseModel):
    street: str
    city: str
    state: str


class User(BaseModel):
    id: int = 0
    name: str
    email: str
    password: str
    address: Address

users = []

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    address: Address    

@app.post("/users{id}/", response_model=UserResponse)
async def create_user(user: User):
    users.append(user)
    return user

@app.get("/users{id}/", response_model=UserResponse)
async def get_users(id: int):
    for user in users:
        if user.id == id:
            return user
    return {"message": "User not found"}
