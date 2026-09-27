from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


class RatingRequest(BaseModel):
    movie_id: int
    rating: float

    @field_validator("rating")
    @classmethod
    def rating_range(cls, v: float) -> float:
        if not (1.0 <= v <= 5.0):
            raise ValueError("Rating must be between 1.0 and 5.0")
        # Round to nearest 0.5
        return round(v * 2) / 2

class RatingResponse(BaseModel):
    id: int
    user_id: int
    movie_id: int
    rating: float
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WatchlistRequest(BaseModel):
    movie_id: int


class WatchlistStatusUpdate(BaseModel):
    status: str  # "to_watch" | "watching" | "watched"


class WatchlistResponse(BaseModel):
    id: int
    movie_id: int
    status: str
    added_at: datetime
    watched_at: Optional[datetime] = None
    movie_title: Optional[str] = None
    movie_poster_url: Optional[str] = None
    movie_year: Optional[int] = None
    movie_genres: Optional[list] = []

    model_config = {"from_attributes": True}


class FavoriteRequest(BaseModel):
    movie_id: int


class FavoriteResponse(BaseModel):
    id: int
    movie_id: int
    created_at: datetime
    movie_title: Optional[str] = None
    movie_poster_url: Optional[str] = None

    model_config = {"from_attributes": True}
