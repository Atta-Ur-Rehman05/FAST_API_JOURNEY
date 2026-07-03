from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str

    # Using SettingsConfigDict for pydantic v2 support
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
