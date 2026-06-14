from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql://user:5565@localhost:5565/weather_db"
    secret_key: str = "your-secret-key-do-not-share-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    weather_api_key: str = "eb297205ee5f84178b5e0fd05e7b5cd7"
    weather_api_url: str = "https://api.openweathermap.org/data/2.5/weather"
    class Config:
        env_file = ".env"

settings = Settings()
