# this file contain the redis setup

import redis.asyncio as redis

REDIS_URL = "redis://localhost:6379"

redis_client = redis.from_url(
    REDIS_URL,
    encoding="utf-8",
    decode_responses=True,
)


