"""
Collaborative Filtering using SVD (Matrix Factorization).
Uses scipy's SVD on the user-item rating matrix.
Train via: scripts/train_model.py
"""
import numpy as np
from scipy.sparse import csr_matrix
from scipy.sparse.linalg import svds
from typing import Dict, List, Tuple


class CollaborativeFilter:
    """
    SVD-based matrix factorization collaborative filter.

    The model learns latent user and item factors from the rating matrix.
    Predictions: R_pred = U * S * Vt + user_means

    Usage (training handled by scripts/train_model.py):
        cf = CollaborativeFilter(n_factors=50)
        cf.fit(ratings_matrix, user_means)
        predictions = cf.predict_for_user(user_idx)
    """

    def __init__(self, n_factors: int = 50):
        self.n_factors = n_factors
        self.U: np.ndarray = None          # User latent factors
        self.S: np.ndarray = None          # Singular values
        self.Vt: np.ndarray = None         # Item latent factors
        self.user_means: np.ndarray = None # Per-user mean ratings
        self.user_id_to_idx: Dict[int, int] = {}
        self.movie_id_to_idx: Dict[int, int] = {}
        self.idx_to_movie_id: Dict[int, int] = {}
        self.predictions_matrix: np.ndarray = None
        self.is_fitted: bool = False

    def fit(
        self,
        ratings_matrix: csr_matrix,
        user_id_to_idx: Dict[int, int],
        movie_id_to_idx: Dict[int, int],
    ) -> "CollaborativeFilter":
        """
        Fit SVD on the rating matrix.

        Args:
            ratings_matrix: User-item sparse matrix
            user_id_to_idx: Mapping from user DB ID -> matrix row
            movie_id_to_idx: Mapping from movie DB ID -> matrix col
        """
        self.user_id_to_idx = user_id_to_idx
        self.movie_id_to_idx = movie_id_to_idx
        self.idx_to_movie_id = {v: k for k, v in movie_id_to_idx.items()}

        # Mean-center the matrix
        matrix_dense = ratings_matrix.toarray().astype(np.float32)
        self.user_means = np.true_divide(
            matrix_dense.sum(axis=1),
            (matrix_dense != 0).sum(axis=1),
            where=(matrix_dense != 0).sum(axis=1) != 0,
        )
        matrix_demeaned = matrix_dense - self.user_means.reshape(-1, 1)
        matrix_demeaned[matrix_dense == 0] = 0  # Keep zeros for unrated

        # SVD decomposition
        k = min(self.n_factors, min(matrix_demeaned.shape) - 1)
        self.U, self.S, self.Vt = svds(matrix_demeaned, k=k)

        # Precompute full predictions matrix
        self.predictions_matrix = (
            np.dot(np.dot(self.U, np.diag(self.S)), self.Vt) +
            self.user_means.reshape(-1, 1)
        )
        self.is_fitted = True
        return self

    def predict_for_user(self, user_id: int) -> List[Tuple[int, float]]:
        """
        Get predicted ratings for all movies for a given user.

        Returns:
            List of (movie_id, predicted_rating) sorted by score descending
        """
        if not self.is_fitted:
            raise RuntimeError("Model not fitted. Run train_model.py first.")

        user_idx = self.user_id_to_idx.get(user_id)
        if user_idx is None:
            return []

        user_predictions = self.predictions_matrix[user_idx]
        results = [
            (self.idx_to_movie_id[i], float(score))
            for i, score in enumerate(user_predictions)
            if i in self.idx_to_movie_id
        ]
        return sorted(results, key=lambda x: x[1], reverse=True)

    def get_top_n(self, user_id: int, n: int = 20, exclude_ids: set = None) -> List[Tuple[int, float]]:
        """Get top-N predicted movies for user, excluding already-rated ones."""
        predictions = self.predict_for_user(user_id)
        if exclude_ids:
            predictions = [(mid, score) for mid, score in predictions if mid not in exclude_ids]
        return predictions[:n]

    def compute_rmse(self, test_ratings: List[Tuple[int, int, float]]) -> float:
        """Compute RMSE on test set [(user_id, movie_id, actual_rating)]."""
        if not self.is_fitted:
            return float("inf")

        errors = []
        for user_id, movie_id, actual in test_ratings:
            user_idx = self.user_id_to_idx.get(user_id)
            movie_idx = self.movie_id_to_idx.get(movie_id)
            if user_idx is None or movie_idx is None:
                continue
            predicted = float(self.predictions_matrix[user_idx, movie_idx])
            errors.append((predicted - actual) ** 2)

        return float(np.sqrt(np.mean(errors))) if errors else float("inf")
