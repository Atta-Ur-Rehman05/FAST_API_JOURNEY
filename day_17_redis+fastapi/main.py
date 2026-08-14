from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from core.redis import redis_client

app = FastAPI()


@app.get("/redis-test")
async def redis_test():
    await redis_client.set("message", "Hello Redis")

    value = await redis_client.get("message")

    return {
        "message": value
    }