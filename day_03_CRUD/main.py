# crud operations: create, read, update, delete

from fastapi import FastAPI
from pydantic import BaseModel
app = FastAPI()

class User(BaseModel):
    id: int = 0
    name: str
    email: str
users = []

@app.post("/users/")
async def create_user(user: User):
    users.append(user)
    return {"message": "User created"}

@app.get("/users/")
async def get_users():
    return {"message": "Users fetched", "users": users}

@app.get("/users/{id}/")
async def get_user(id: int):
    for user in users:
        if user.id == id:
            return {"message": "User fetched", "user": user}
    return {"message": "User not found"}


@app.put("/users/{id}/")
async def update_user(id: int, user: User):
    for i, u in enumerate(users):
        if u.id == id:
            users[i] = user
            return {"message": "User updated"}
    return {"message": "User not found"}

@app.delete("/users/{id}/")
async def delete_user(id: int):
    for i, u in enumerate(users):
        if u.id == id:
            del users[i]
            return {"message": "User deleted"}
    return {"message": "User not found"}

