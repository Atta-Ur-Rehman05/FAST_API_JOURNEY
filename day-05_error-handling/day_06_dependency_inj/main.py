# dependency injection
# dependency injection is a design pattern that allows us to inject dependencies into a class or function, 
# rather than hardcoding them. This makes our code more flexible and easier to test.  
# In FastAPI, we can use the Depends function to inject dependencies into our endpoints.
# ...............................................................................................................

from fastapi import FastAPI, Depends
from fastapi.responses import JSONResponse
from fastapi.exceptions import HTTPException
from fastapi import Header


app = FastAPI()

def common_parameters(q: str = None, limit: int = 10):
    return {"q": q, "limit": limit}

@app.get("/items/")
async def read_items(commons: dict = Depends(common_parameters)):
    return commons

@app.get("/users/")
async def read_users(commons: dict = Depends(common_parameters)):
    return commons



# authentication dependency................................................................
def verify_key(api_key: str):
    if api_key != "secret":
        raise HTTPException(status_code=401, detail="Invalid API Key")
    return 
    {"message": "API Key is valid",     "authorized": True } 

@app.get("/getusers/{user_id}")
async def get_user(user_id: int, api_key: dict = Depends(verify_key)):
    return {"message": f"User {user_id} fetched successfully", "authorized": api_key["authorized"]}


@app.get("/getitems/{item_id}")
async def get_item(item_id: int, api_key: dict = Depends(verify_key)):
    return {"message": f"Item {item_id} fetched successfully", "authorized": api_key["authorized"]}



# dependency chain ......................................................

def get_db():
    db = {"users": ["user1", "user2"], "items": ["item1", "item2"]}
    return db

def get_user_db(db: dict = Depends(get_db)):
    return db["users"]

def get_item_db(db: dict = Depends(get_db)):
    return db["items"]

@app.get("/users/")
async def read_users(users: list = Depends(get_user_db)):
    return {"message": "Users fetched successfully", "users": users}



# simple authentication dependency....................................................................

def authenticate(token: str = Header(...)):
    if token != "secret-token":
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    return {"username": "atta"}


@app.get("/profile/")
async def read_profile(user: dict = Depends(authenticate)):
    return {"message": "Profile fetched successfully", "user": user}

