import requests
from fastapi import FastAPI

app = FastAPI()

@app.get("/posts")
async def get_posts():
    response = requests.get("https://jsonplaceholder.typicode.com/posts")
    print(response.status_code)
    return response.json()

@app.get("/posts/{id}")
async def get_post(id: int):
    response = requests.get(f"https://jsonplaceholder.typicode.com/posts/{id}")
    return response.json()



