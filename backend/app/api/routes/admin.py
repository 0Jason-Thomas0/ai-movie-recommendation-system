from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.dependencies import require_admin
from app.models.user import User, UserRole
from app.models.movie import Movie, Genre
from app.models.rating import Rating
from app.schemas.user import UserListResponse, UserResponse
from app.schemas.auth import MessageResponse

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/users", response_model=List[UserListResponse])
def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, le=100),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    users = db.query(User).offset((page - 1) * per_page).limit(per_page).all()
    result = []
    for u in users:
        count = db.query(func.count(Rating.id)).filter(Rating.user_id == u.id).scalar()
        result.append(UserListResponse(
            id=u.id,
            email=u.email,
            username=u.username,
            role=u.role,
            is_active=u.is_active,
            created_at=u.created_at,
            rating_count=count,
        ))
    return result


@router.patch("/users/{user_id}/toggle-active", response_model=MessageResponse)
def toggle_user_active(
    user_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    db.commit()
    status = "activated" if user.is_active else "deactivated"
    return MessageResponse(message=f"User {status}")


@router.patch("/users/{user_id}/role", response_model=MessageResponse)
def change_user_role(
    user_id: int,
    role: str,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    try:
        user.role = UserRole(role)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid role")
    db.commit()
    return MessageResponse(message=f"Role updated to {role}")


@router.get("/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    total_users = db.query(func.count(User.id)).scalar()
    total_movies = db.query(func.count(Movie.id)).scalar()
    total_ratings = db.query(func.count(Rating.id)).scalar()
    ratings_today = db.query(func.count(Rating.id)).filter(Rating.created_at >= today).scalar()
    avg_rating = db.query(func.avg(Rating.rating)).scalar()
    new_users_week = db.query(func.count(User.id)).filter(
        User.created_at >= datetime.utcnow() - timedelta(days=7)
    ).scalar()

    top_rated = (
        db.query(Movie)
        .filter(Movie.rating_count >= 5)
        .order_by(desc(Movie.avg_rating))
        .limit(5)
        .all()
    )

    return {
        "total_users": total_users,
        "total_movies": total_movies,
        "total_ratings": total_ratings,
        "ratings_today": ratings_today,
        "avg_rating": round(float(avg_rating), 2) if avg_rating else 0.0,
        "new_users_this_week": new_users_week,
        "top_rated_movies": [
            {"id": m.id, "title": m.title, "avg_rating": m.avg_rating}
            for m in top_rated
        ],
    }


@router.get("/ratings", response_model=List[dict])
def list_all_ratings(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, le=200),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    ratings = (
        db.query(Rating)
        .order_by(desc(Rating.created_at))
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    return [
        {
            "id": r.id,
            "user_id": r.user_id,
            "movie_id": r.movie_id,
            "rating": r.rating,
            "created_at": r.created_at.isoformat(),
            "movie_title": r.movie.title if r.movie else None,
            "username": r.user.username if r.user else None,
        }
        for r in ratings
    ]
