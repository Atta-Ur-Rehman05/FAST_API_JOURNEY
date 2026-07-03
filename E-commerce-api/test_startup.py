import asyncio
from main import lifespan, app

async def test():
    async with lifespan(app):
        print("Startup successful")

if __name__ == "__main__":
    asyncio.run(test())
