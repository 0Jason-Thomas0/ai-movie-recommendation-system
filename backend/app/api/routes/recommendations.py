from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.recommendation import Recommendation, RecommendationItem
from app.models.movie import Movie
from app.schemas.recommendation import RecommendationResponse, RecommendationItemResponse
from app.services.recommendation_service import RecommendationService

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.get("", response_model=RecommendationResponse)
def get_recommendations(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get personalized movie recommendations for the current user."""
    service = RecommendationService(db)
    return service.get_or_generate(current_user, limit=limit)


@router.post("/refresh", response_model=RecommendationResponse)
def refresh_recommendations(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Force-regenerate recommendations."""
    service = RecommendationService(db)
    return service.generate(current_user, limit=limit)


@router.get("/history", response_model=List[RecommendationResponse])
def recommendation_history(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the user's recommendation history."""
    recs = (
        db.query(Recommendation)
        .filter(Recommendation.user_id == current_user.id)
        .order_by(Recommendation.generated_at.desc())
        .limit(limit)
        .all()
    )
    results = []
    for rec in recs:
        items = []
        for item in rec.items:
            movie = item.movie
            items.append(RecommendationItemResponse(
                movie_id=item.movie_id,
                movie_title=movie.title if movie else "Unknown",
                movie_poster_url=movie.poster_url if movie else None,
                movie_year=movie.release_year if movie else None,
                movie_genres=[g.name for g in movie.genres] if movie else [],
                score=item.score,
                reason=item.reason,
                rank=item.rank,
            ))
        results.append(RecommendationResponse(
            id=rec.id,
            model_version=rec.model_version,
            algorithm=rec.algorithm,
            generated_at=rec.generated_at,
            items=items,
        ))
    return results
