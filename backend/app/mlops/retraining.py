"""
Automatic Retraining Scheduler.
Uses APScheduler to check every hour whether enough new ratings
have accumulated since the last training to trigger a retrain.
"""
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import SessionLocal
from app.ml.model_store import ModelStore
from app.mlops.monitor import ModelMonitor


def _should_retrain(db: Session, store: ModelStore) -> bool:
    """Return True if MIN_RATINGS_FOR_RETRAIN new ratings since last training."""
    from app.models.rating import Rating
    from sqlalchemy import func

    metadata = store.load_metadata()
    if not metadata:
        # No model yet — retrain if we have enough ratings at all
        count = db.query(func.count(Rating.id)).scalar() or 0
        return count >= settings.MIN_RATINGS_FOR_RETRAIN

    last_trained = metadata.get("trained_at")
    if not last_trained:
        return True

    # Count new ratings since last training
    from datetime import datetime
    try:
        last_dt = datetime.fromisoformat(last_trained)
    except Exception:
        return True

    new_ratings = db.query(func.count(Rating.id)).filter(Rating.created_at > last_dt).scalar() or 0
    return new_ratings >= settings.MIN_RATINGS_FOR_RETRAIN


def run_scheduled_check():
    """Periodic check: retrain if threshold met and not already running."""
    db = SessionLocal()
    try:
        store = ModelStore()
        monitor = ModelMonitor()

        if monitor.get_stats().get("retraining_status") == "running":
            return  # Already training

        if _should_retrain(db, store):
            print(f"[Scheduler] Retraining threshold met. Starting pipeline...")
            from app.mlops.pipeline import RetrainingPipeline
            pipeline = RetrainingPipeline(db)
            pipeline.run()
        else:
            print(f"[Scheduler] Not enough new ratings for retraining.")
    except Exception as e:
        print(f"[Scheduler] Error: {e}")
    finally:
        db.close()


def start_retraining_scheduler():
    """Start the background retraining scheduler. Call from main.py startup."""
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        run_scheduled_check,
        trigger=IntervalTrigger(hours=settings.RETRAIN_CHECK_INTERVAL_HOURS),
        id="auto_retrain",
        name="Auto Retraining Check",
        replace_existing=True,
    )
    scheduler.start()
    print(f"[Scheduler] Auto-retraining scheduler started (interval={settings.RETRAIN_CHECK_INTERVAL_HOURS}h)")
    return scheduler
