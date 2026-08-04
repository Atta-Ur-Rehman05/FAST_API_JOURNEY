# this is the database connection file

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from app.core.config import settings



#   create async engine
# SQL statements can include personal and financial data.  Keep statement
# logging off by default and enable it only with SQL_ECHO=true while debugging.
engine = create_async_engine(settings.DATABASE_URL, echo=settings.SQL_ECHO)

# create async session
AsyncSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession, expire_on_commit=False)

# create base
Base = declarative_base()

# create async session
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
