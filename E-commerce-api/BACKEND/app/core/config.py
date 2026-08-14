# this file contain the shared configuration for the application
# this mean that this file will be used by all the other modules in the application

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, model_validator

class Settings(BaseSettings):  # configuration schema for the application
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 30
    PASSWORD_MIN_LENGTH: int = 8
    LOGIN_RATE_LIMIT_ATTEMPTS: int = 5
    LOGIN_RATE_LIMIT_WINDOW_SECONDS: int = 900
    LOGIN_RATE_LIMIT_ENABLED: bool = True
    REDIS_URL: str | None = None
    SENTRY_DSN: str | None = None
    ENVIRONMENT: str = "development"
    EXPOSE_RESET_TOKEN_IN_DEVELOPMENT: bool = False
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
    REFRESH_COOKIE_NAME: str = "refresh_token"
    REFRESH_COOKIE_SECURE: bool = False
    REFRESH_COOKIE_SAMESITE: str = "lax"
    REFRESH_COOKIE_DOMAIN: str | None = None
    BACKEND_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:5173"
    ISSUER: str = "ecommerce-api"
    AUDIENCE: str = "ecommerce-client"
    TAX_RATE: float = 0.05
    SHIPPING_FLAT: float = 99.0
    FREE_SHIPPING_THRESHOLD: float = 999.0

    @model_validator(mode="after")
    def validate_production_settings(self) -> "Settings":
        """Fail fast when a deployment has unsafe production configuration."""
        if self.ENVIRONMENT != "production":
            return self

        unsafe_secret_values = {
            "replace-with-a-long-random-secret",
            "change-me",
            "secret",
        }
        if len(self.SECRET_KEY) < 32 or self.SECRET_KEY.lower() in unsafe_secret_values:
            raise ValueError("SECRET_KEY must be a unique random value of at least 32 characters in production")
        if not self.DATABASE_URL.startswith("postgresql+asyncpg://"):
            raise ValueError("DATABASE_URL must use the PostgreSQL asyncpg driver in production")
        if not self.CORS_ORIGINS:
            raise ValueError("CORS_ORIGINS must contain the HTTPS frontend origin in production")
        if any(origin == "*" or not origin.startswith("https://") for origin in self.CORS_ORIGINS):
            raise ValueError("CORS_ORIGINS must contain explicit HTTPS origins in production")
        if self.SQL_ECHO:
            raise ValueError("SQL_ECHO must be false in production")
        if self.EXPOSE_RESET_TOKEN_IN_DEVELOPMENT:
            raise ValueError("EXPOSE_RESET_TOKEN_IN_DEVELOPMENT must be false in production")
        if not self.LOGIN_RATE_LIMIT_ENABLED or not self.REDIS_URL:
            raise ValueError("LOGIN_RATE_LIMIT_ENABLED=true and REDIS_URL are required in production")
        if not self.REFRESH_COOKIE_SECURE:
            raise ValueError("REFRESH_COOKIE_SECURE must be true in production")
        if self.REFRESH_COOKIE_SAMESITE.lower() not in {"lax", "strict"}:
            raise ValueError("REFRESH_COOKIE_SAMESITE must be lax or strict in production")
        if self.PASSWORD_MIN_LENGTH < 12:
            raise ValueError("PASSWORD_MIN_LENGTH must be at least 12 in production")
        if not self.BACKEND_URL.startswith("https://"):
            raise ValueError("BACKEND_URL must use HTTPS in production")
        if not self.FRONTEND_URL.startswith("https://"):
            raise ValueError("FRONTEND_URL must use HTTPS in production")
        return self

    # Using SettingsConfigDict for pydantic v2 support
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
