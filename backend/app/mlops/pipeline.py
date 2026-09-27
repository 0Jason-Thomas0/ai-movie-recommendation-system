"""
MLOps Retraining Pipeline.
Full pipeline: preprocess → train CF → train CB → evaluate → save.
NOTE: This pipeline is triggered by admin or auto-scheduler.
      The actual training is done here. Run scripts/train_model.py for standalone training.
"""
import os
import time
from datetime import datetime
from typing import Optional
import pandas as pd
from sqlalchemy.orm import Session

from app.ml.preprocessing import build_ratings_matrix, build_movie_features, train_test_split_temporal
from app.ml.collaborative_filter import CollaborativeFilter
from app.ml.content_filter import ContentFilter
from app.ml.model_store import ModelStore
from app.mlops.monitor import ModelMonitor
from app.mlops.mlflow_tracker import MLflowTracker


class RetrainingPipeline:
    """
    End-to-end retraining pipeline.
    Reads from the DB, trains CF + CB models, evaluates, saves.
    """

    def __init__(self, db: Session):
        self.db = db
        self.store = ModelStore()
        self.monitor = ModelMonitor()
        self.tracker = MLflowTracker()

    def run(self):
        """Execute the full pipeline."""
        self.monitor.set_retraining_status("running", progress=0.0)
        start_time = time.time()

        try:
            print("[Pipeline] Step 1/5: Loading data...")
            ratings_df, movies_df = self._load_data()
            if len(ratings_df) < 10:
                print("[Pipeline] Not enough ratings to train. Skipping.")
                self.monitor.set_retraining_status("idle")
                return
            self.monitor.set_retraining_status("running", progress=20.0)

            print("[Pipeline] Step 2/5: Preprocessing...")
            train_df, test_df = train_test_split_temporal(ratings_df)
            matrix, user_idx, movie_idx = build_ratings_matrix(train_df)
            feature_matrix, _ = build_movie_features(movies_df)
            movie_ids = movies_df["id"].tolist()
            self.monitor.set_retraining_status("running", progress=40.0)

            print("[Pipeline] Step 3/5: Training Collaborative Filter (SVD)...")
            cf = CollaborativeFilter(n_factors=50)
            cf.fit(matrix, user_idx, movie_idx)
            self.monitor.set_retraining_status("running", progress=60.0)

            print("[Pipeline] Step 4/5: Training Content-Based Filter...")
            cb = ContentFilter()
            cb.fit(feature_matrix, movie_ids)
            self.monitor.set_retraining_status("running", progress=75.0)

            print("[Pipeline] Step 5/5: Evaluating and saving...")
            test_triples = list(zip(test_df["user_id"], test_df["movie_id"], test_df["rating"]))
            rmse = cf.compute_rmse(test_triples)
            precision = self._compute_precision_at_k(cf, test_df, k=10)
            elapsed = time.time() - start_time

            # Generate version string
            version = datetime.utcnow().strftime("v%Y%m%d_%H%M")

            model_bundle = {
                "cf": cf,
                "cb": cb,
                "cf_weight": 0.6,
                "cb_weight": 0.4,
                "version": version,
            }
            metadata = {
                "version": version,
                "trained_at": datetime.utcnow().isoformat(),
                "algorithm": "hybrid_svd_tfidf",
                "rmse": round(rmse, 4),
                "accuracy": round(precision, 4),
                "total_ratings_used": len(train_df),
                "n_users": len(user_idx),
                "n_movies": len(movie_idx),
                "training_time_seconds": round(elapsed, 2),
            }

            self.store.save_model(model_bundle, metadata)

            # Log to MLflow
            self.tracker.log_run(
                params={"n_factors": 50, "cf_weight": 0.6, "cb_weight": 0.4},
                metrics={"rmse": rmse, "precision_at_10": precision, "training_time_s": elapsed},
                model_version=version,
            )

            self.monitor.set_retraining_status("completed", progress=100.0)
            self.monitor.update_accuracy(precision)
            print(f"[Pipeline] Done! Version={version}, RMSE={rmse:.4f}, Precision@10={precision:.4f}")

        except Exception as e:
            print(f"[Pipeline] Error: {e}")
            self.monitor.set_retraining_status("failed")
            raise

    def _load_data(self):
        """Query ratings and movies from the database into DataFrames."""
        from app.models.rating import Rating
        from app.models.movie import Movie

        ratings = self.db.query(Rating).all()
        ratings_df = pd.DataFrame([
            {"user_id": r.user_id, "movie_id": r.movie_id, "rating": r.rating, "created_at": r.created_at}
            for r in ratings
        ])

        movies = self.db.query(Movie).all()
        movies_df = pd.DataFrame([
            {
                "id": m.id,
                "title": m.title,
                "genres": " ".join(g.name for g in m.genres),
                "director": m.director or "",
                "cast": m.cast or "",
                "overview": m.overview or "",
            }
            for m in movies
        ])

        return ratings_df, movies_df

    def _compute_precision_at_k(self, cf: CollaborativeFilter, test_df: pd.DataFrame, k: int = 10) -> float:
        """Precision@K: fraction of top-K recommendations that are relevant (rating >= 4)."""
        relevant_threshold = 4.0
        precisions = []

        for user_id in test_df["user_id"].unique()[:50]:  # sample 50 users for speed
            user_test = test_df[test_df["user_id"] == user_id]
            relevant_ids = set(user_test[user_test["rating"] >= relevant_threshold]["movie_id"].tolist())
            if not relevant_ids:
                continue

            top_k = cf.get_top_n(user_id, n=k)
            recommended_ids = {mid for mid, _ in top_k}
            hits = len(recommended_ids & relevant_ids)
            precisions.append(hits / k)

        return sum(precisions) / len(precisions) if precisions else 0.0
