"""
Hybrid Recommendation Engine.
Combines collaborative filtering (SVD) and content-based filtering
using a weighted blend strategy.

Weights:
  - CF score: 60% (stronger for users with many ratings)
  - CB score: 40% (stronger for new users)
  - Weights auto-adjust based on user rating count.
"""
from typing import List, Dict, Optional
from app.ml.collaborative_filter import CollaborativeFilter
from app.ml.content_filter import ContentFilter


class HybridRecommender:
    """
    Wraps a trained model bundle (CF + CB) and blends their scores.
    Expected model bundle structure (from ModelStore):
    {
        "cf": CollaborativeFilter,
        "cb": ContentFilter,
        "cf_weight": 0.6,
        "cb_weight": 0.4,
        "version": "1.0.0",
    }
    """

    def __init__(self, model_bundle: dict):
        self.cf: Optional[CollaborativeFilter] = model_bundle.get("cf")
        self.cb: Optional[ContentFilter] = model_bundle.get("cb")
        self.cf_weight: float = model_bundle.get("cf_weight", 0.6)
        self.cb_weight: float = model_bundle.get("cb_weight", 0.4)

    def recommend(
        self,
        user_id: int,
        candidate_movie_ids: List[int],
        liked_movie_ids: Optional[List[int]] = None,
        rating_count: Optional[int] = None,
        top_n: int = 20,
    ) -> List[Dict]:
        """
        Generate hybrid recommendations for a user.

        Args:
            user_id: DB user ID
            candidate_movie_ids: Movies to score (unrated movies)
            liked_movie_ids: Movies user rated >= 4.0 (for CB)
            rating_count: Number of ratings by the user used to adjust blending weights
            top_n: Number of recommendations to return

        Returns:
            List of dicts: {movie_id, score, reason}
        """
        candidate_set = set(candidate_movie_ids)
        if rating_count is not None:
            self.adjust_weights_by_rating_count(rating_count)

        cf_scores: Dict[int, float] = {}
        cb_scores: Dict[int, float] = {}

        # Collaborative Filtering scores
        if self.cf and self.cf.is_fitted:
            cf_preds = self.cf.get_top_n(user_id, n=len(candidate_set) * 2)
            max_cf = max((s for _, s in cf_preds), default=1.0) or 1.0
            cf_scores = {mid: score / max_cf for mid, score in cf_preds if mid in candidate_set}

        # Content-Based scores
        if self.cb and self.cb.is_fitted and liked_movie_ids:
            cb_preds = self.cb.recommend_for_user(
                liked_movie_ids,
                top_n=len(candidate_set) * 2,
                exclude_ids=set(liked_movie_ids),
            )
            max_cb = max((s for _, s in cb_preds), default=1.0) or 1.0
            cb_scores = {mid: score / max_cb for mid, score in cb_preds if mid in candidate_set}

        # Blend scores
        all_ids = set(cf_scores.keys()) | set(cb_scores.keys())
        blended = []
        for mid in all_ids:
            cf_s = cf_scores.get(mid, 0.0)
            cb_s = cb_scores.get(mid, 0.0)
            final_score = (self.cf_weight * cf_s) + (self.cb_weight * cb_s)

            if cf_s > 0 and cb_s > 0:
                reason = "Matched your taste and similar movies you loved"
            elif cf_s > 0:
                reason = "Users like you also enjoyed this"
            else:
                reason = "Similar to movies you rated highly"

            blended.append({"movie_id": mid, "score": round(final_score, 4), "reason": reason})

        blended.sort(key=lambda x: x["score"], reverse=True)
        return blended[:top_n]

    def adjust_weights_by_rating_count(self, rating_count: int):
        """Dynamically shift weights — more ratings → trust CF more."""
        if rating_count < 5:
            self.cf_weight, self.cb_weight = 0.0, 1.0
        elif rating_count < 20:
            self.cf_weight, self.cb_weight = 0.3, 0.7
        elif rating_count < 50:
            self.cf_weight, self.cb_weight = 0.5, 0.5
        else:
            self.cf_weight, self.cb_weight = 0.7, 0.3
