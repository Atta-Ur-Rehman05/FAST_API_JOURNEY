from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.db import create_tables
from app.api.routes import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    await create_tables()
    yield
    # Shutdown actions could go here if needed

app = FastAPI(title="E-Commerce API", lifespan=lifespan)

# Add CORS Middleware to allow requests from Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from Vite (http://localhost:5173, 5174, etc.)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "Welcome to the E-commerce API"}
