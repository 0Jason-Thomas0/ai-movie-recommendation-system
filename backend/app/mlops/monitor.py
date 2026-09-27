"""
Model Monitor — tracks retraining status, accuracy, and response times.
Uses a JSON file for lightweight persistence (no extra DB table needed).
"""
import os
import json
import time
from datetime import datetime
from typing import Optional, Dict, Any
from app.core.config import settings


class ModelMonitor:
    def __init__(self):
        self.stats_path = os.path.join(settings.MODEL_DIR, "monitor_stats.json")
        os.makedirs(settings.MODEL_DIR, exist_ok=True)
        self._response_times = []  # In-memory circular buffer

    def _load(self) -> Dict[str, Any]:
        if not os.path.exists(self.stats_path):
            return {
                "retraining_status": "idle",
                "retraining_progress": None,
                "last_accuracy": None,
                "avg_response_time_ms": None,
                "response_time_samples": [],
                "last_updated": None,
            }
        try:
            with open(self.stats_path, "r") as f:
                return json.load(f)
        except Exception:
            return {}

    def _save(self, data: Dict[str, Any]):
        data["last_updated"] = datetime.utcnow().isoformat()
        try:
            with open(self.stats_path, "w") as f:
                json.dump(data, f, indent=2, default=str)
        except Exception as e:
            print(f"[Monitor] Could not save stats: {e}")

    def set_retraining_status(self, status: str, progress: Optional[float] = None):
        """Update retraining status (idle | running | completed | failed)."""
        data = self._load()
        data["retraining_status"] = status
        data["retraining_progress"] = progress
        if status == "completed":
            data["last_retrain_completed"] = datetime.utcnow().isoformat()
        self._save(data)

    def update_accuracy(self, accuracy: float):
        data = self._load()
        data["last_accuracy"] = accuracy
        self._save(data)

    def record_response_time(self, ms: float):
        """Record a recommendation response time for rolling average."""
        data = self._load()
        times = data.get("response_time_samples", [])
        times.append(ms)
        times = times[-100:]  # Keep last 100
        data["response_time_samples"] = times
        data["avg_response_time_ms"] = sum(times) / len(times) if times else None
        self._save(data)

    def get_stats(self) -> Dict[str, Any]:
        return self._load()

    def time_recommendation(self, func, *args, **kwargs):
        """Decorator-style timer for recommendation calls."""
        start = time.time()
        result = func(*args, **kwargs)
        elapsed_ms = (time.time() - start) * 1000
        self.record_response_time(elapsed_ms)
        return result
