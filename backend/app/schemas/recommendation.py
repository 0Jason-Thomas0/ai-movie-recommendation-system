from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class RecommendationItemResponse(BaseModel):
    movie_id: int
    movie_title: str
    movie_poster_url: Optional[str] = None
    movie_year: Optional[int] = None
    movie_genres: List[str] = []
    score: Optional[float] = None
    reason: Optional[str] = None
    rank: int

    model_config = {"from_attributes": True}


class RecommendationResponse(BaseModel):
    id: int
    model_version: Optional[str] = None
    algorithm: Optional[str] = None
    generated_at: datetime
    items: List[RecommendationItemResponse] = []

    model_config = {"from_attributes": True}


class ModelVersionInfo(BaseModel):
    version: str
    accuracy: Optional[float] = None
    trained_at: Optional[datetime] = None
    algorithm: str
    total_ratings_used: Optional[int] = None


class MLOpsStatusResponse(BaseModel):
    current_model_version: Optional[str] = None
    last_training_time: Optional[datetime] = None
    recommendation_accuracy: Optional[float] = None
    total_ratings: int = 0
    total_users: int = 0
    total_movies: int = 0
    retraining_status: str = "idle"  # idle | running | completed | failed
    retraining_progress: Optional[float] = None
    model_health: str = "unknown"  # healthy | degraded | untrained
    avg_response_time_ms: Optional[float] = None
    movies_rated_today: int = 0
    model_versions: List[ModelVersionInfo] = []
