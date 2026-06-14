from fastapi import FastAPI
from app.db.database import engine
from app.models.models import Base
from app.api.endpoints import router

app = FastAPI(title="Weather API Fullstack")
# Create tables if they don't exist
Base.metadata.create_all(bind=engine)



app.include_router(router)
