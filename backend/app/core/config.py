from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List
import os


class Settings(BaseSettings):
    # App
    APP_ENV: str = "development"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000

    # Database
    DATABASE_URL: str = "postgresql://cineai:cineai_secret@localhost:5432/cineai_db"

    # JWT
    SECRET_KEY: str = "dev-secret-key-change-in-production-32-chars-minimum"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    # TMDb
    TMDB_API_KEY: str = ""
    TMDB_BASE_URL: str = "https://api.themoviedb.org/3"
    TMDB_IMAGE_BASE_URL: str = "https://image.tmdb.org/t/p/w500"

    @property
    def tmdb_enabled(self) -> bool:
        return bool(self.TMDB_API_KEY)

    # MLflow
    MLFLOW_TRACKING_URI: str = "http://localhost:5000"
    MLFLOW_EXPERIMENT_NAME: str = "cineai-recommendations"

    # Admin
    ADMIN_EMAIL: str = "admin@cineai.com"
    ADMIN_PASSWORD: str = "Admin@123"

    # ML
    MODEL_DIR: str = "./models"
    MIN_RATINGS_FOR_RETRAIN: int = 50
    RETRAIN_CHECK_INTERVAL_HOURS: int = 1

    model_config = {"env_file": ".env", "case_sensitive": True, "extra": "ignore"}


settings = Settings()
