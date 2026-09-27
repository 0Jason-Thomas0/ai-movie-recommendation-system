from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.watchlist import WatchlistItem, WatchlistStatus
from app.models.movie import Movie
from app.models.user import User
from app.schemas.rating import WatchlistRequest, WatchlistStatusUpdate, WatchlistResponse

router = APIRouter(prefix="/watchlist", tags=["Watchlist"])


def _build_response(item: WatchlistItem) -> WatchlistResponse:
    movie = item.movie
    genres = [g.name for g in movie.genres] if movie else []
    return WatchlistResponse(
        id=item.id,
        movie_id=item.movie_id,
        status=item.status.value,
        added_at=item.added_at,
        watched_at=item.watched_at,
        movie_title=movie.title if movie else None,
        movie_poster_url=movie.poster_url if movie else None,
        movie_year=movie.release_year if movie else None,
        movie_genres=genres,
    )


@router.get("", response_model=List[WatchlistResponse])
def get_watchlist(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = db.query(WatchlistItem).filter(WatchlistItem.user_id == current_user.id).all()
    return [_build_response(i) for i in items]


@router.post("", response_model=WatchlistResponse, status_code=201)
def add_to_watchlist(
    payload: WatchlistRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not db.query(Movie).filter(Movie.id == payload.movie_id).first():
        raise HTTPException(status_code=404, detail="Movie not found")

    existing = db.query(WatchlistItem).filter(
        WatchlistItem.user_id == current_user.id,
        WatchlistItem.movie_id == payload.movie_id,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Movie already in watchlist")

    item = WatchlistItem(user_id=current_user.id, movie_id=payload.movie_id)
    db.add(item)
    db.commit()
    db.refresh(item)
    return _build_response(item)


@router.patch("/{movie_id}/status", response_model=WatchlistResponse)
def update_watchlist_status(
    movie_id: int,
    payload: WatchlistStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(WatchlistItem).filter(
        WatchlistItem.user_id == current_user.id,
        WatchlistItem.movie_id == movie_id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Movie not in watchlist")

    try:
        item.status = WatchlistStatus(payload.status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid status. Use: to_watch, watching, watched")

    if item.status == WatchlistStatus.WATCHED and not item.watched_at:
        item.watched_at = datetime.utcnow()

    db.commit()
    db.refresh(item)
    return _build_response(item)


@router.delete("/{movie_id}", status_code=204)
def remove_from_watchlist(
    movie_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(WatchlistItem).filter(
        WatchlistItem.user_id == current_user.id,
        WatchlistItem.movie_id == movie_id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Movie not in watchlist")
    db.delete(item)
    db.commit()
