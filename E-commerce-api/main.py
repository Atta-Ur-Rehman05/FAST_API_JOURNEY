from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.db.db import create_tables
from app.api.routes import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    await create_tables()
    yield
    # Shutdown actions could go here if needed

app = FastAPI(lifespan=lifespan)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "Welcome to the E-commerce API"}
