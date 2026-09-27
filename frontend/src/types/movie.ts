export interface Genre {
  id: number;
  name: string;
}

export interface Movie {
  id: number;
  title: string;
  original_title?: string;
  overview?: string;
  tagline?: string;
  tmdb_id?: number;
  imdb_id?: string;
  movielens_id?: number;
  poster_path?: string;
  backdrop_path?: string;
  trailer_key?: string;
  release_date?: string;
  release_year?: number;
  runtime?: number;
  language?: string;
  director?: string;
  cast?: string;
  imdb_rating?: number;
  tmdb_rating?: number;
  popularity: number;
  vote_count?: number;
  avg_rating: number;
  rating_count: number;
  is_trending: boolean;
  is_featured: boolean;
  poster_url?: string;
  backdrop_url?: string;
  genres: Genre[];
  created_at: string;
  // User-specific
  user_rating?: number | null;
  is_in_watchlist?: boolean | null;
  is_favorited?: boolean | null;
}

export interface MovieSearchResponse {
  items: Movie[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface MovieFilters {
  query?: string;
  genre?: string;
  year_min?: number;
  year_max?: number;
  language?: string;
  rating_min?: number;
  sort_by?: 'popularity' | 'rating' | 'year' | 'title';
  page?: number;
  per_page?: number;
}

export interface WatchlistItem {
  id: number;
  movie_id: number;
  status: 'to_watch' | 'watching' | 'watched';
  added_at: string;
  watched_at?: string;
  movie_title?: string;
  movie_poster_url?: string;
  movie_year?: number;
  movie_genres?: string[];
}

export interface FavoriteItem {
  id: number;
  movie_id: number;
  created_at: string;
  movie_title?: string;
  movie_poster_url?: string;
}

export interface RatingItem {
  id: number;
  user_id: number;
  movie_id: number;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface RecommendationItem {
  movie_id: number;
  movie_title: string;
  movie_poster_url?: string;
  movie_year?: number;
  movie_genres: string[];
  score?: number;
  reason?: string;
  rank: number;
}

export interface Recommendation {
  id: number;
  model_version?: string;
  algorithm?: string;
  generated_at: string;
  items: RecommendationItem[];
}

export interface Notification {
  id: number;
  type: 'recommendation' | 'watchlist' | 'model_update' | 'system';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}
