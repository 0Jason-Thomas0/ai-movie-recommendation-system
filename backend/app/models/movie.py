from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Text, DateTime,
    Table, ForeignKey, Boolean
)
from sqlalchemy.orm import relationship
from app.core.database import Base

# Many-to-many: movies <-> genres
movie_genres = Table(
    "movie_genres",
    Base.metadata,
    Column("movie_id", Integer, ForeignKey("movies.id"), primary_key=True),
    Column("genre_id", Integer, ForeignKey("genres.id"), primary_key=True),
)


class Genre(Base):
    __tablename__ = "genres"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    tmdb_id = Column(Integer, nullable=True)

    movies = relationship("Movie", secondary=movie_genres, back_populates="genres")

    def __repr__(self):
        return f"<Genre {self.name}>"


class Movie(Base):
    __tablename__ = "movies"

    id = Column(Integer, primary_key=True, index=True)

    # Core metadata
    title = Column(String(500), nullable=False, index=True)
    original_title = Column(String(500), nullable=True)
    overview = Column(Text, nullable=True)
    tagline = Column(String(500), nullable=True)

    # External IDs
    tmdb_id = Column(Integer, unique=True, nullable=True, index=True)
    imdb_id = Column(String(20), unique=True, nullable=True)
    movielens_id = Column(Integer, unique=True, nullable=True, index=True)

    # Media
    poster_path = Column(String(500), nullable=True)
    backdrop_path = Column(String(500), nullable=True)
    trailer_key = Column(String(100), nullable=True)  # YouTube key

    # Details
    release_date = Column(String(20), nullable=True)
    release_year = Column(Integer, nullable=True, index=True)
    runtime = Column(Integer, nullable=True)  # minutes
    language = Column(String(10), default="en")
    status = Column(String(50), nullable=True)

    # People
    director = Column(String(200), nullable=True)
    cast = Column(Text, nullable=True)  # JSON string of cast list

    # Ratings
    imdb_rating = Column(Float, nullable=True)
    tmdb_rating = Column(Float, nullable=True)
    popularity = Column(Float, default=0.0)
    vote_count = Column(Integer, default=0)

    # CineAI internal
    avg_rating = Column(Float, default=0.0)
    rating_count = Column(Integer, default=0)
    is_trending = Column(Boolean, default=False)
    is_featured = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    genres = relationship("Genre", secondary=movie_genres, back_populates="movies")
    ratings = relationship("Rating", back_populates="movie", cascade="all, delete-orphan")
    watchlist_items = relationship("WatchlistItem", back_populates="movie", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="movie", cascade="all, delete-orphan")

    @property
    def poster_url(self) -> str | None:
        from app.core.config import settings
        if self.poster_path:
            if self.poster_path.startswith("http"):
                return self.poster_path
            return f"{settings.TMDB_IMAGE_BASE_URL}{self.poster_path}"
        return None

    @property
    def backdrop_url(self) -> str | None:
        from app.core.config import settings
        if self.backdrop_path:
            if self.backdrop_path.startswith("http"):
                return self.backdrop_path
            return f"https://image.tmdb.org/t/p/original{self.backdrop_path}"
        return None

    def __repr__(self):
        return f"<Movie {self.title} ({self.release_year})>"
