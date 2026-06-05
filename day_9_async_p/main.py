# this file contains async programming example
# for async the asyncio library is used that to be installed first using pip install asyncio

from fastapi import FastAPI
import asyncio

app = FastAPI()

# synchronous endpoint
@app.get("/sync")
def sync_example():
    import time
    time.sleep(2)  # Simulate a long-running task
    return {"message": "This is a sync endpoint!"}


@app.get("/async")
async def async_example():
    await asyncio.sleep(2)  # Simulate a long-running task
    return {"message": "This is an async endpoint!"}


# summary:
# this code defines a FastAPI application with two endpoints:
#  "/sync" and "/async". The "/sync" endpoint simulates a long-running task using time.sleep(),
#  which blocks the execution of the server for 2 seconds before returning a response. 
# The "/async" endpoint, on the other hand, uses asyncio.sleep() to simulate a long-running task without blocking the server, 
# allowing it to handle other requests concurrently. This demonstrates the difference between synchronous and asynchronous programming in FastAPI.
