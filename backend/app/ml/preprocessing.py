"""
Data preprocessing for the recommendation engine.
Converts raw ratings to matrices suitable for collaborative and content-based filtering.
"""
import pandas as pd
import numpy as np
from typing import Tuple
from scipy.sparse import csr_matrix


def build_ratings_matrix(ratings_df: pd.DataFrame) -> Tuple[csr_matrix, dict, dict]:
    """
    Build a user-item sparse matrix from ratings dataframe.

    Args:
        ratings_df: DataFrame with columns [user_id, movie_id, rating]

    Returns:
        (sparse_matrix, user_id_to_idx, movie_id_to_idx)
    """
    users = ratings_df["user_id"].unique()
    movies = ratings_df["movie_id"].unique()

    user_idx = {uid: i for i, uid in enumerate(users)}
    movie_idx = {mid: i for i, mid in enumerate(movies)}

    rows = ratings_df["user_id"].map(user_idx).values
    cols = ratings_df["movie_id"].map(movie_idx).values
    data = ratings_df["rating"].values.astype(np.float32)

    matrix = csr_matrix((data, (rows, cols)), shape=(len(users), len(movies)))
    return matrix, user_idx, movie_idx


def build_movie_features(movies_df: pd.DataFrame) -> Tuple[np.ndarray, pd.DataFrame]:
    """
    Build TF-IDF feature matrix from movie metadata.

    Args:
        movies_df: DataFrame with columns [id, title, genres, director, cast, overview]

    Returns:
        (feature_matrix, processed_df)
    """
    from sklearn.feature_extraction.text import TfidfVectorizer

    movies_df = movies_df.copy()

    # Combine features into a single text blob
    movies_df["genres"] = movies_df["genres"].fillna("")
    movies_df["director"] = movies_df["director"].fillna("")
    movies_df["cast"] = movies_df["cast"].fillna("")
    movies_df["overview"] = movies_df["overview"].fillna("")

    movies_df["combined_features"] = (
        movies_df["genres"] + " " +
        movies_df["director"] + " " +
        movies_df["cast"] + " " +
        movies_df["overview"].str[:200]
    )

    tfidf = TfidfVectorizer(
        max_features=5000,
        stop_words="english",
        ngram_range=(1, 2),
        min_df=2,
    )
    feature_matrix = tfidf.fit_transform(movies_df["combined_features"])

    return feature_matrix, movies_df


def normalize_ratings(ratings_df: pd.DataFrame) -> pd.DataFrame:
    """Mean-center ratings per user."""
    df = ratings_df.copy()
    user_means = df.groupby("user_id")["rating"].mean()
    df["rating_normalized"] = df.apply(
        lambda row: row["rating"] - user_means[row["user_id"]], axis=1
    )
    return df


def train_test_split_temporal(
    ratings_df: pd.DataFrame,
    test_ratio: float = 0.2
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Temporal split: newest ratings go to test set.
    """
    if "created_at" in ratings_df.columns:
        ratings_df = ratings_df.sort_values("created_at")
    else:
        ratings_df = ratings_df.sample(frac=1, random_state=42)

    split = int(len(ratings_df) * (1 - test_ratio))
    return ratings_df.iloc[:split], ratings_df.iloc[split:]
