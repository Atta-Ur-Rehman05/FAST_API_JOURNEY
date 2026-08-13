# this is the database connection file

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from app.core.config import settings


def _build_engine_kwargs() -> dict:
    kwargs = {"echo": settings.SQL_ECHO}
    if settings.DATABASE_URL.startswith("postgresql+asyncpg://"):
        kwargs.update(
            {
                "pool_size": 10,
                "max_overflow": 20,
                "pool_timeout": 30,
                "pool_recycle": 1800,
                "pool_pre_ping": True,
            }
        )
    return kwargs


engine = create_async_engine(settings.DATABASE_URL, **_build_engine_kwargs())

AsyncSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

# create tables (Deprecated: Use Alembic instead)
async def create_tables():
    pass
    # from app.models import models
    # async with engine.begin() as conn:
    #     # This ONLY creates tables if they do not already exist. 
    #     # It never deletes existing data.
    #     await conn.run_sync(Base.metadata.create_all)
