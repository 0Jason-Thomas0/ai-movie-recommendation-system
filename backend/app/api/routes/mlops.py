from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.dependencies import require_admin, get_current_user
from app.models.user import User
from app.models.rating import Rating
from app.models.movie import Movie
from app.ml.model_store import ModelStore
from app.mlops.monitor import ModelMonitor
from app.schemas.recommendation import MLOpsStatusResponse, ModelVersionInfo
from app.schemas.auth import MessageResponse

router = APIRouter(prefix="/mlops", tags=["MLOps"])


@router.get("/status", response_model=MLOpsStatusResponse)
def get_mlops_status(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Get current MLOps pipeline status and model metrics."""
    store = ModelStore()
    monitor = ModelMonitor()

    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    total_ratings = db.query(func.count(Rating.id)).scalar() or 0
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_movies = db.query(func.count(Movie.id)).scalar() or 0
    ratings_today = db.query(func.count(Rating.id)).filter(Rating.created_at >= today).scalar() or 0

    metadata = store.load_metadata()
    monitor_data = monitor.get_stats()

    versions = []
    for v in store.list_versions():
        versions.append(ModelVersionInfo(
            version=v.get("version", "unknown"),
            accuracy=v.get("accuracy"),
            trained_at=v.get("trained_at"),
            algorithm=v.get("algorithm", "hybrid"),
            total_ratings_used=v.get("total_ratings_used"),
        ))

    return MLOpsStatusResponse(
        current_model_version=metadata.get("version") if metadata else None,
        last_training_time=metadata.get("trained_at") if metadata else None,
        recommendation_accuracy=metadata.get("accuracy") if metadata else None,
        total_ratings=total_ratings,
        total_users=total_users,
        total_movies=total_movies,
        retraining_status=monitor_data.get("retraining_status", "idle"),
        retraining_progress=monitor_data.get("retraining_progress"),
        model_health="untrained" if not metadata else ("healthy" if metadata.get("accuracy", 0) > 0.5 else "degraded"),
        avg_response_time_ms=monitor_data.get("avg_response_time_ms"),
        movies_rated_today=ratings_today,
        model_versions=versions,
    )


@router.post("/retrain", response_model=MessageResponse)
def trigger_retrain(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Manually trigger model retraining pipeline (runs in background)."""
    from app.mlops.pipeline import RetrainingPipeline
    monitor = ModelMonitor()
    if monitor.get_stats().get("retraining_status") == "running":
        raise HTTPException(status_code=409, detail="Retraining is already in progress")

    pipeline = RetrainingPipeline(db)
    background_tasks.add_task(pipeline.run)
    return MessageResponse(message="Model retraining started in background")


@router.get("/monitor", response_model=dict)
def get_monitor_stats(_admin: User = Depends(require_admin)):
    """Get detailed monitoring metrics."""
    monitor = ModelMonitor()
    return monitor.get_stats()


@router.get("/versions", response_model=list)
def list_model_versions(_admin: User = Depends(require_admin)):
    """List all available model versions."""
    store = ModelStore()
    return store.list_versions()
