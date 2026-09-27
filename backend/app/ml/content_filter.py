"""
Content-Based Filtering using TF-IDF + Cosine Similarity.
Recommends movies similar to ones the user has highly rated.
Train via: scripts/train_model.py
"""
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from scipy.sparse import csr_matrix
from typing import Dict, List, Tuple, Optional


class ContentFilter:
    """
    Content-based recommender using TF-IDF vectorization of movie metadata.

    Feature space: genres + director + cast + overview keywords

    Usage (training handled by scripts/train_model.py):
        cf = ContentFilter()
        cf.fit(feature_matrix, movie_ids)
        similar = cf.get_similar(movie_id, top_n=10)
    """

    def __init__(self):
        self.feature_matrix: Optional[csr_matrix] = None
        self.movie_id_to_idx: Dict[int, int] = {}
        self.idx_to_movie_id: Dict[int, int] = {}
        self.similarity_matrix: Optional[np.ndarray] = None
        self.is_fitted: bool = False

    def fit(self, feature_matrix, movie_ids: List[int]) -> "ContentFilter":
        """
        Store feature matrix and precompute pairwise cosine similarities.

        Args:
            feature_matrix: TF-IDF sparse matrix (n_movies × n_features)
            movie_ids: List of DB movie IDs corresponding to matrix rows
        """
        self.feature_matrix = feature_matrix
        self.movie_id_to_idx = {mid: i for i, mid in enumerate(movie_ids)}
        self.idx_to_movie_id = {i: mid for i, mid in enumerate(movie_ids)}

        # Compute pairwise cosine similarity
        dense = feature_matrix.toarray() if hasattr(feature_matrix, "toarray") else feature_matrix
        self.similarity_matrix = cosine_similarity(dense)
        self.is_fitted = True
        return self

    def get_similar(self, movie_id: int, top_n: int = 10, exclude_ids: set = None) -> List[Tuple[int, float]]:
        """
        Get top-N movies most similar to the given movie.

        Returns:
            List of (movie_id, similarity_score) sorted descending
        """
        if not self.is_fitted:
            raise RuntimeError("Model not fitted. Run train_model.py first.")

        movie_idx = self.movie_id_to_idx.get(movie_id)
        if movie_idx is None:
            return []

        sim_scores = list(enumerate(self.similarity_matrix[movie_idx]))
        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
        # Skip the movie itself (score = 1.0)
        sim_scores = [(self.idx_to_movie_id[i], score) for i, score in sim_scores if i != movie_idx]

        if exclude_ids:
            sim_scores = [(mid, s) for mid, s in sim_scores if mid not in exclude_ids]

        return sim_scores[:top_n]

    def recommend_for_user(
        self,
        liked_movie_ids: List[int],
        top_n: int = 20,
        exclude_ids: set = None,
    ) -> List[Tuple[int, float]]:
        """
        Aggregate similar movies for a list of liked movie IDs.

        Scores are averaged across source movies for deduplication.

        Returns:
            List of (movie_id, avg_score) sorted descending
        """
        if not self.is_fitted:
            raise RuntimeError("Model not fitted. Run train_model.py first.")

        score_map: Dict[int, List[float]] = {}
        for source_id in liked_movie_ids:
            similar = self.get_similar(source_id, top_n=top_n * 2, exclude_ids=exclude_ids)
            for mid, score in similar:
                score_map.setdefault(mid, []).append(score)

        # Average scores and sort
        aggregated = [(mid, float(np.mean(scores))) for mid, scores in score_map.items()]
        aggregated.sort(key=lambda x: x[1], reverse=True)
        return aggregated[:top_n]
