from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func, desc
from typing import Optional, List
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin, get_optional_user
from app.models.movie import Movie, Genre
from app.models.rating import Rating
from app.models.watchlist import WatchlistItem
from app.models.favorite import Favorite
from app.models.user import User
from app.schemas.movie import (
    MovieResponse, MovieListResponse, MovieSearchResponse,
    MovieCreateRequest, MovieUpdateRequest
)
import json

router = APIRouter(prefix="/movies", tags=["Movies"])


def _enrich_movie(movie: Movie, user: Optional[User], db: Session) -> dict:
    """Add user-specific fields (rating, watchlist, favorite) to a movie dict."""
    data = {
        "id": movie.id,
        "title": movie.title,
        "original_title": movie.original_title,
        "overview": movie.overview,
        "tagline": movie.tagline,
        "tmdb_id": movie.tmdb_id,
        "imdb_id": movie.imdb_id,
        "movielens_id": movie.movielens_id,
        "poster_path": movie.poster_path,
        "backdrop_path": movie.backdrop_path,
        "trailer_key": movie.trailer_key,
        "release_date": movie.release_date,
        "release_year": movie.release_year,
        "runtime": movie.runtime,
        "language": movie.language,
        "director": movie.director,
        "cast": movie.cast,
        "imdb_rating": movie.imdb_rating,
        "tmdb_rating": movie.tmdb_rating,
        "popularity": movie.popularity,
        "vote_count": movie.vote_count,
        "avg_rating": movie.avg_rating,
        "rating_count": movie.rating_count,
        "is_trending": movie.is_trending,
        "is_featured": movie.is_featured,
        "poster_url": movie.poster_url,
        "backdrop_url": movie.backdrop_url,
        "genres": [{"id": g.id, "name": g.name} for g in movie.genres],
        "created_at": movie.created_at,
        "user_rating": None,
        "is_in_watchlist": None,
        "is_favorited": None,
    }
    if user:
        rating = db.query(Rating).filter(Rating.user_id == user.id, Rating.movie_id == movie.id).first()
        data["user_rating"] = rating.rating if rating else None
        wl = db.query(WatchlistItem).filter(WatchlistItem.user_id == user.id, WatchlistItem.movie_id == movie.id).first()
        data["is_in_watchlist"] = wl is not None
        fav = db.query(Favorite).filter(Favorite.user_id == user.id, Favorite.movie_id == movie.id).first()
        data["is_favorited"] = fav is not None
    return data


@router.get("", response_model=MovieSearchResponse)
def list_movies(
    query: Optional[str] = Query(None),
    genre: Optional[str] = Query(None),
    year_min: Optional[int] = Query(None),
    year_max: Optional[int] = Query(None),
    language: Optional[str] = Query(None),
    rating_min: Optional[float] = Query(None),
    sort_by: str = Query("popularity"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Search and filter movies."""
    q = db.query(Movie)

    if query:
        search = f"%{query}%"
        q = q.filter(
            or_(
                Movie.title.ilike(search),
                Movie.director.ilike(search),
                Movie.cast.ilike(search),
            )
        )
    if genre:
        q = q.join(Movie.genres).filter(Genre.name.ilike(f"%{genre}%"))
    if year_min:
        q = q.filter(Movie.release_year >= year_min)
    if year_max:
        q = q.filter(Movie.release_year <= year_max)
    if language:
        q = q.filter(Movie.language == language)
    if rating_min:
        q = q.filter(Movie.avg_rating >= rating_min)

    sort_map = {
        "popularity": desc(Movie.popularity),
        "rating": desc(Movie.avg_rating),
        "year": desc(Movie.release_year),
        "title": Movie.title,
    }
    q = q.order_by(sort_map.get(sort_by, desc(Movie.popularity)))

    total = q.count()
    items = q.offset((page - 1) * per_page).limit(per_page).all()

    return MovieSearchResponse(
        items=[MovieListResponse.model_validate(m) for m in items],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=(total + per_page - 1) // per_page,
    )


@router.get("/trending", response_model=List[MovieListResponse])
def get_trending(limit: int = Query(20, le=50), db: Session = Depends(get_db)):
    movies = db.query(Movie).filter(Movie.is_trending == True).order_by(desc(Movie.popularity)).limit(limit).all()
    return [MovieListResponse.model_validate(m) for m in movies]


@router.get("/featured", response_model=List[MovieListResponse])
def get_featured(limit: int = Query(10, le=20), db: Session = Depends(get_db)):
    movies = db.query(Movie).filter(Movie.is_featured == True).order_by(desc(Movie.popularity)).limit(limit).all()
    return [MovieListResponse.model_validate(m) for m in movies]


@router.get("/top-rated", response_model=List[MovieListResponse])
def get_top_rated(limit: int = Query(20, le=50), db: Session = Depends(get_db)):
    movies = db.query(Movie).filter(Movie.rating_count >= 5).order_by(desc(Movie.avg_rating)).limit(limit).all()
    return [MovieListResponse.model_validate(m) for m in movies]


@router.get("/new-releases", response_model=List[MovieListResponse])
def get_new_releases(limit: int = Query(20, le=50), db: Session = Depends(get_db)):
    movies = db.query(Movie).filter(Movie.release_year.isnot(None)).order_by(desc(Movie.release_year), desc(Movie.popularity)).limit(limit).all()
    return [MovieListResponse.model_validate(m) for m in movies]


@router.get("/genres", response_model=List[dict])
def get_genres(db: Session = Depends(get_db)):
    genres = db.query(Genre).order_by(Genre.name).all()
    return [{"id": g.id, "name": g.name} for g in genres]


@router.get("/{movie_id}", response_model=MovieResponse)
def get_movie(
    movie_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    return _enrich_movie(movie, current_user, db)


@router.get("/{movie_id}/similar", response_model=List[MovieListResponse])
def get_similar_movies(movie_id: int, limit: int = Query(10, le=20), db: Session = Depends(get_db)):
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    genre_ids = [g.id for g in movie.genres]
    if not genre_ids:
        return []
    similar = (
        db.query(Movie)
        .join(Movie.genres)
        .filter(Genre.id.in_(genre_ids), Movie.id != movie_id)
        .order_by(desc(Movie.popularity))
        .distinct()
        .limit(limit)
        .all()
    )
    return [MovieListResponse.model_validate(m) for m in similar]


# ─── Admin-only CRUD ──────────────────────────────────────────────────────────

@router.post("", response_model=MovieResponse, status_code=201)
def create_movie(
    payload: MovieCreateRequest,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    movie = Movie(**payload.model_dump(exclude={"genre_ids"}))
    for gid in payload.genre_ids:
        genre = db.query(Genre).filter(Genre.id == gid).first()
        if genre:
            movie.genres.append(genre)
    db.add(movie)
    db.commit()
    db.refresh(movie)
    return _enrich_movie(movie, None, db)


@router.put("/{movie_id}", response_model=MovieResponse)
def update_movie(
    movie_id: int,
    payload: MovieUpdateRequest,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    update_data = payload.model_dump(exclude_none=True, exclude={"genre_ids"})
    for key, val in update_data.items():
        setattr(movie, key, val)

    if payload.genre_ids is not None:
        movie.genres = []
        for gid in payload.genre_ids:
            genre = db.query(Genre).filter(Genre.id == gid).first()
            if genre:
                movie.genres.append(genre)

    db.commit()
    db.refresh(movie)
    return _enrich_movie(movie, None, db)


@router.delete("/{movie_id}", status_code=204)
def delete_movie(
    movie_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    db.delete(movie)
    db.commit()
