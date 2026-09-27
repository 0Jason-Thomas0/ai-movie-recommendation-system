from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class GenreSchema(BaseModel):
    id: int
    name: str
    model_config = {"from_attributes": True}


class MovieBase(BaseModel):
    title: str
    overview: Optional[str] = None
    release_year: Optional[int] = None
    release_date: Optional[str] = None
    runtime: Optional[int] = None
    language: Optional[str] = "en"
    director: Optional[str] = None
    cast: Optional[str] = None
    imdb_rating: Optional[float] = None
    tmdb_rating: Optional[float] = None
    popularity: Optional[float] = 0.0
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None
    trailer_key: Optional[str] = None
    tagline: Optional[str] = None


class MovieCreateRequest(MovieBase):
    genre_ids: List[int] = []
    tmdb_id: Optional[int] = None
    imdb_id: Optional[str] = None


class MovieUpdateRequest(BaseModel):
    title: Optional[str] = None
    overview: Optional[str] = None
    release_year: Optional[int] = None
    runtime: Optional[int] = None
    director: Optional[str] = None
    cast: Optional[str] = None
    imdb_rating: Optional[float] = None
    tmdb_rating: Optional[float] = None
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None
    trailer_key: Optional[str] = None
    is_trending: Optional[bool] = None
    is_featured: Optional[bool] = None
    genre_ids: Optional[List[int]] = None


class MovieResponse(MovieBase):
    id: int
    tmdb_id: Optional[int] = None
    imdb_id: Optional[str] = None
    movielens_id: Optional[int] = None
    genres: List[GenreSchema] = []
    avg_rating: float = 0.0
    rating_count: int = 0
    is_trending: bool = False
    is_featured: bool = False
    poster_url: Optional[str] = None
    backdrop_url: Optional[str] = None
    created_at: datetime

    # User-specific fields (populated when authenticated)
    user_rating: Optional[float] = None
    is_in_watchlist: Optional[bool] = None
    is_favorited: Optional[bool] = None

    model_config = {"from_attributes": True}


class MovieListResponse(BaseModel):
    id: int
    title: str
    release_year: Optional[int] = None
    genres: List[GenreSchema] = []
    avg_rating: float = 0.0
    rating_count: int = 0
    poster_url: Optional[str] = None
    imdb_rating: Optional[float] = None
    popularity: float = 0.0
    is_trending: bool = False

    model_config = {"from_attributes": True}


class MovieSearchResponse(BaseModel):
    items: List[MovieListResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


class MovieFilters(BaseModel):
    query: Optional[str] = None
    genre: Optional[str] = None
    year_min: Optional[int] = None
    year_max: Optional[int] = None
    language: Optional[str] = None
    rating_min: Optional[float] = None
    sort_by: Optional[str] = "popularity"  # popularity, rating, year, title
    page: int = 1
    per_page: int = 20
