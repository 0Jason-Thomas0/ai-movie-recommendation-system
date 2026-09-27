"""
MLflow Experiment Tracker.
Logs model training runs, parameters, and metrics to MLflow.
Falls back gracefully if MLflow server is unavailable.
"""
import os
from typing import Dict, Any, Optional
from app.core.config import settings


class MLflowTracker:
    def __init__(self):
        self.enabled = False
        try:
            import mlflow
            mlflow.set_tracking_uri(settings.MLFLOW_TRACKING_URI)
            mlflow.set_experiment(settings.MLFLOW_EXPERIMENT_NAME)
            self.mlflow = mlflow
            self.enabled = True
        except Exception as e:
            print(f"[MLflow] Tracking disabled: {e}")

    def log_run(
        self,
        params: Dict[str, Any],
        metrics: Dict[str, float],
        model_version: str,
        tags: Optional[Dict[str, str]] = None,
    ):
        """Log a training run to MLflow."""
        if not self.enabled:
            print(f"[MLflow] (offline) Would log: version={model_version}, metrics={metrics}")
            return

        try:
            with self.mlflow.start_run(run_name=f"CineAI-{model_version}"):
                self.mlflow.log_params(params)
                self.mlflow.log_metrics(metrics)
                self.mlflow.set_tag("model_version", model_version)
                if tags:
                    for k, v in tags.items():
                        self.mlflow.set_tag(k, v)
                print(f"[MLflow] Run logged for version {model_version}")
        except Exception as e:
            print(f"[MLflow] Failed to log run: {e}")

    def get_best_run(self) -> Optional[Dict[str, Any]]:
        """Retrieve the best run by RMSE metric."""
        if not self.enabled:
            return None
        try:
            runs = self.mlflow.search_runs(order_by=["metrics.rmse ASC"], max_results=1)
            if not runs.empty:
                return runs.iloc[0].to_dict()
        except Exception:
            return None
        return None
