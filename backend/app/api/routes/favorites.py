from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.favorite import Favorite
from app.models.movie import Movie
from app.models.user import User
from app.schemas.rating import FavoriteRequest, FavoriteResponse

router = APIRouter(prefix="/favorites", tags=["Favorites"])


@router.get("", response_model=List[FavoriteResponse])
def get_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    favs = db.query(Favorite).filter(Favorite.user_id == current_user.id).all()
    result = []
    for fav in favs:
        movie = fav.movie
        result.append(FavoriteResponse(
            id=fav.id,
            movie_id=fav.movie_id,
            created_at=fav.created_at,
            movie_title=movie.title if movie else None,
            movie_poster_url=movie.poster_url if movie else None,
        ))
    return result


@router.post("", response_model=FavoriteResponse, status_code=201)
def add_favorite(
    payload: FavoriteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not db.query(Movie).filter(Movie.id == payload.movie_id).first():
        raise HTTPException(status_code=404, detail="Movie not found")

    existing = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.movie_id == payload.movie_id,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Movie already in favorites")

    fav = Favorite(user_id=current_user.id, movie_id=payload.movie_id)
    db.add(fav)
    db.commit()
    db.refresh(fav)

    movie = db.query(Movie).filter(Movie.id == payload.movie_id).first()
    return FavoriteResponse(
        id=fav.id,
        movie_id=fav.movie_id,
        created_at=fav.created_at,
        movie_title=movie.title if movie else None,
        movie_poster_url=movie.poster_url if movie else None,
    )


@router.delete("/{movie_id}", status_code=204)
def remove_favorite(
    movie_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    fav = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.movie_id == movie_id,
    ).first()
    if not fav:
        raise HTTPException(status_code=404, detail="Movie not in favorites")
    db.delete(fav)
    db.commit()
