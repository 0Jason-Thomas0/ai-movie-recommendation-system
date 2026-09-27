from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.rating import Rating
from app.models.movie import Movie
from app.models.user import User
from app.schemas.rating import RatingRequest, RatingResponse

router = APIRouter(prefix="/ratings", tags=["Ratings"])


def _update_movie_avg(db: Session, movie_id: int):
    """Recalculate and persist movie average rating."""
    result = db.query(func.avg(Rating.rating), func.count(Rating.id)).filter(Rating.movie_id == movie_id).first()
    avg, count = result
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if movie:
        movie.avg_rating = round(float(avg), 2) if avg else 0.0
        movie.rating_count = count or 0
        db.commit()


@router.post("", response_model=RatingResponse, status_code=status.HTTP_201_CREATED)
def rate_movie(
    payload: RatingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit or update a movie rating (1–5 stars)."""
    movie = db.query(Movie).filter(Movie.id == payload.movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    existing = db.query(Rating).filter(
        Rating.user_id == current_user.id,
        Rating.movie_id == payload.movie_id,
    ).first()

    if existing:
        existing.rating = payload.rating
        db.commit()
        db.refresh(existing)
        _update_movie_avg(db, payload.movie_id)
        return existing
    else:
        rating = Rating(user_id=current_user.id, movie_id=payload.movie_id, rating=payload.rating)
        db.add(rating)
        db.commit()
        db.refresh(rating)
        _update_movie_avg(db, payload.movie_id)
        return rating


@router.delete("/{movie_id}", status_code=204)
def delete_rating(
    movie_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a rating."""
    rating = db.query(Rating).filter(
        Rating.user_id == current_user.id,
        Rating.movie_id == movie_id,
    ).first()
    if not rating:
        raise HTTPException(status_code=404, detail="Rating not found")
    db.delete(rating)
    db.commit()
    _update_movie_avg(db, movie_id)


@router.get("/my", response_model=list[RatingResponse])
def my_ratings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all ratings by the current user."""
    return db.query(Rating).filter(Rating.user_id == current_user.id).all()
