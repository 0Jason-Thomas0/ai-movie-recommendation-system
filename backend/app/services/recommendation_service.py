"""
Recommendation Service — orchestrates the hybrid ML engine.
Falls back to popularity-based recommendations if no model is trained.
"""
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.models.user import User
from app.models.movie import Movie, Genre
from app.models.rating import Rating
from app.models.recommendation import Recommendation, RecommendationItem
from app.schemas.recommendation import RecommendationResponse, RecommendationItemResponse
from app.ml.model_store import ModelStore
from app.ml.hybrid import HybridRecommender


class RecommendationService:
    def __init__(self, db: Session):
        self.db = db
        self.store = ModelStore()

    def get_or_generate(self, user: User, limit: int = 20) -> RecommendationResponse:
        """Return cached recommendations or generate new ones."""
        latest = (
            self.db.query(Recommendation)
            .filter(Recommendation.user_id == user.id)
            .order_by(Recommendation.generated_at.desc())
            .first()
        )
        # Return latest if generated within 1 hour
        if latest:
            age_hours = (datetime.utcnow() - latest.generated_at).total_seconds() / 3600
            if age_hours < 1:
                return self._to_response(latest)

        return self.generate(user, limit=limit)

    def generate(self, user: User, limit: int = 20) -> RecommendationResponse:
        """Generate fresh recommendations for the user."""
        rating_count = self.db.query(func.count(Rating.id)).filter(Rating.user_id == user.id).scalar() or 0
        model = self.store.load_model()

        if model and rating_count >= 5:
            movie_ids, scores, reasons, algorithm = self._ml_recommendations(user, model, limit, rating_count)
        elif rating_count > 0:
            movie_ids, scores, reasons, algorithm = self._content_recommendations(user, limit)
        else:
            movie_ids, scores, reasons, algorithm = self._cold_start_recommendations(user, limit)

        # Persist recommendation batch
        rec = Recommendation(
            user_id=user.id,
            model_version=self.store.load_metadata().get("version") if model else None,
            algorithm=algorithm,
            generated_at=datetime.utcnow(),
        )
        self.db.add(rec)
        self.db.flush()

        items = []
        for rank, (movie_id, score, reason) in enumerate(zip(movie_ids, scores, reasons), start=1):
            item = RecommendationItem(
                recommendation_id=rec.id,
                movie_id=movie_id,
                score=score,
                reason=reason,
                rank=rank,
            )
            self.db.add(item)
            items.append(item)

        self.db.commit()
        self.db.refresh(rec)
        return self._to_response(rec)

    def _ml_recommendations(self, user: User, model, limit: int, rating_count: int):
        """Use trained hybrid model to generate recommendations."""
        try:
            recommender = HybridRecommender(model)
            user_ratings = self.db.query(Rating).filter(Rating.user_id == user.id).all()
            rated_ids = [r.movie_id for r in user_ratings]
            liked_ids = [r.movie_id for r in user_ratings if r.rating >= 4.0]
            all_movie_ids = [m.id for m in self.db.query(Movie.id).all()]
            candidates = [mid for mid in all_movie_ids if mid not in rated_ids]

            results = recommender.recommend(
                user.id,
                candidates,
                liked_movie_ids=liked_ids if liked_ids else None,
                rating_count=rating_count,
                top_n=limit,
            )
            movie_ids = [r["movie_id"] for r in results]
            scores = [r["score"] for r in results]
            reasons = [r.get("reason", "Based on your ratings") for r in results]
            return movie_ids, scores, reasons, "hybrid"
        except Exception:
            return self._content_recommendations(user, limit)

    def _content_recommendations(self, user: User, limit: int):
        """Content-based: recommend movies similar to highest-rated."""
        top_ratings = (
            self.db.query(Rating)
            .filter(Rating.user_id == user.id, Rating.rating >= 4.0)
            .order_by(desc(Rating.rating))
            .limit(5)
            .all()
        )
        rated_ids = {r.movie_id for r in self.db.query(Rating).filter(Rating.user_id == user.id).all()}

        seen_ids = set()
        movie_ids, scores, reasons = [], [], []

        for rating in top_ratings:
            source_movie = self.db.query(Movie).filter(Movie.id == rating.movie_id).first()
            if not source_movie:
                continue
            genre_ids = [g.id for g in source_movie.genres]
            similar = (
                self.db.query(Movie)
                .join(Movie.genres)
                .filter(Genre.id.in_(genre_ids), ~Movie.id.in_(rated_ids), ~Movie.id.in_(seen_ids))
                .order_by(desc(Movie.popularity))
                .limit(5)
                .all()
            )
            for m in similar:
                if len(movie_ids) >= limit:
                    break
                seen_ids.add(m.id)
                movie_ids.append(m.id)
                scores.append(round(rating.rating / 5.0, 3))
                reasons.append(f"Because you rated '{source_movie.title}' {rating.rating}★")

        # Fill remaining with popularity
        if len(movie_ids) < limit:
            extra = self._popular_movies(exclude_ids=rated_ids | seen_ids, limit=limit - len(movie_ids))
            movie_ids.extend(extra["ids"])
            scores.extend(extra["scores"])
            reasons.extend(extra["reasons"])

        return movie_ids[:limit], scores[:limit], reasons[:limit], "content_based"

    def _cold_start_recommendations(self, user: User, limit: int):
        """Cold-start: genre-based popularity for new users."""
        fav_genres = user.favorite_genres or []
        rated_ids: set = set()

        if fav_genres:
            movies = (
                self.db.query(Movie)
                .join(Movie.genres)
                .filter(Genre.name.in_(fav_genres))
                .order_by(desc(Movie.popularity))
                .limit(limit)
                .all()
            )
            if movies:
                ids = [m.id for m in movies]
                return ids, [0.8] * len(ids), [f"Popular in your favorite genres"] * len(ids), "cold_start_genre"

        # Ultimate fallback: top popular movies
        extra = self._popular_movies(exclude_ids=set(), limit=limit)
        return extra["ids"], extra["scores"], extra["reasons"], "cold_start_popular"

    def _popular_movies(self, exclude_ids: set, limit: int) -> dict:
        movies = (
            self.db.query(Movie)
            .filter(~Movie.id.in_(exclude_ids) if exclude_ids else True)
            .order_by(desc(Movie.popularity))
            .limit(limit)
            .all()
        )
        return {
            "ids": [m.id for m in movies],
            "scores": [round(m.popularity / 1000, 3) for m in movies],
            "reasons": ["Trending & Popular"] * len(movies),
        }

    def _to_response(self, rec: Recommendation) -> RecommendationResponse:
        items = []
        for item in sorted(rec.items, key=lambda x: x.rank):
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
        return RecommendationResponse(
            id=rec.id,
            model_version=rec.model_version,
            algorithm=rec.algorithm,
            generated_at=rec.generated_at,
            items=items,
        )
