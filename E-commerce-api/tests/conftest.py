import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.postgresql import JSONB, UUID

@compiles(JSONB, 'sqlite')
def compile_jsonb(type_, compiler, **kw):
    return 'JSON'

@compiles(UUID, 'sqlite')
def compile_uuid(type_, compiler, **kw):
    return 'VARCHAR'

from main import app
from app.db.db import Base, get_db
from app.models import models

# Use sqlite for tests to keep it simple, fast, and isolated.
# SQLite doesn't natively support JSONB from postgresql dialect, so it might warn/error. 
# In SQLAlchemy 2.0, non-native types are often fallback compiled.
SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(SQLALCHEMY_DATABASE_URL, echo=False)
TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine, class_=AsyncSession, expire_on_commit=False
)

@pytest_asyncio.fixture(autouse=True)
async def test_db_setup():
    # Setup test tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Teardown test tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest_asyncio.fixture()
async def db_session(test_db_setup):
    async with TestingSessionLocal() as session:
        yield session

@pytest_asyncio.fixture()
async def client(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()

import uuid
from app.models.models import User, RoleType
from app.core.security import create_access_token

@pytest_asyncio.fixture()
async def customer_user(db_session):
    user = User(
        id=uuid.uuid4(),
        email=f"customer_{uuid.uuid4()}@example.com",
        password_hash="fakehash",
        first_name="Cust",
        last_name="Omer",
        role=RoleType.customer
    )
    db_session.add(user)
    await db_session.commit()
    return user

@pytest_asyncio.fixture()
def auth_headers_customer(customer_user):
    token = create_access_token(subject=str(customer_user.id))
    return {"Authorization": f"Bearer {token}"}

@pytest_asyncio.fixture()
async def admin_user(db_session):
    user = User(
        id=uuid.uuid4(),
        email=f"admin_{uuid.uuid4()}@example.com",
        password_hash="fakehash",
        first_name="Ad",
        last_name="Min",
        role=RoleType.admin
    )
    db_session.add(user)
    await db_session.commit()
    return user

@pytest_asyncio.fixture()
def auth_headers_admin(admin_user):
    token = create_access_token(subject=str(admin_user.id))
    return {"Authorization": f"Bearer {token}"}
