# REQUEST BODY
# JSON INPUT HANDLING
# Pydantic Model
# DATA VALIDATION
# AUTOMATIC DOCUMENTATION
# CREATE SCHEMAS
# NESTED MODELS
# SWAGGER UI





from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Address(BaseModel):
    street: str
    city: str
    state: str
    zip: str

class User(BaseModel):
    id: int = 0
    name: str
    email: str
    address: Address

@app.post("/users{id}/")
async def create_user(user: User):
    return {"message": "User created successfully", "user": user}

@app.get("/users{id}/")
async def get_users(id: int):
    return {"message": "Users fetched successfully", "users": user.name}   


