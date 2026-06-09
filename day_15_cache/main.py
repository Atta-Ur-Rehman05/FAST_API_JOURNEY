# this file contain caching

from fastapi import FastAPI
from fastapi.responses import JSONResponse
import requests
import time

app = FastAPI()

# caching
cache = {}

start_time = time.time()

@app.get("/posts")
async def get_posts():
    if "posts" in cache:
        return JSONResponse({"message": "Posts fetched successfully", "posts": cache["posts"]})
    else:
        time.sleep(5)
        response = requests.get("https://jsonplaceholder.typicode.com/posts")
        cache["posts"] = response.json()
        return JSONResponse({"message": "Posts fetched successfully", "posts": cache["posts"]})

@app.get("/posts/{id}")
async def get_post(id: int):   
    start_time = time.time()
    if "posts" in cache:
        end_time = time.time()
        time_taken=end_time-start_time
        return JSONResponse({"message": "Post fetched successfully", "posts": cache["posts"], "time_taken": time_taken})
    else:
        time.sleep(5)   
        response = requests.get(f"https://jsonplaceholder.typicode.com/posts/{id}")
        cache["posts"] = response.json()
        end_time = time.time()
        time_taken=end_time-start_time
        return JSONResponse({"message": "Post fetched successfully", "posts": cache["posts"], "time_taken": time_taken})