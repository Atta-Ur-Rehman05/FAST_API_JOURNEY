from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.db.db import create_tables

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    await create_tables()
    yield
    # Shutdown actions could go here if needed

app = FastAPI(lifespan=lifespan)

@app.get("/")
async def root():
    return {"message": "Welcome to the E-commerce API"}
