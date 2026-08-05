from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    # Environment variables for list settings use JSON, for example:
    # CORS_ORIGINS='["https://shop.example.com"]'
    # The default is deliberately limited to the local Vite development UI.
    CORS_ORIGINS: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])
    SQL_ECHO: bool = False
    # Leave these unset in environments where Stripe is not enabled. They
    # must be supplied by the deployment environment, never by a client.
    STRIPE_SECRET_KEY: str | None = None
    STRIPE_WEBHOOK_SECRET: str | None = None
    STRIPE_CURRENCY: str = "usd"

    # Using SettingsConfigDict for pydantic v2 support
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
