export interface MLOpsStatus {
  current_model_version?: string;
  last_training_time?: string;
  recommendation_accuracy?: number;
  total_ratings: number;
  total_users: number;
  total_movies: number;
  retraining_status: 'idle' | 'running' | 'completed' | 'failed';
  retraining_progress?: number;
  model_health: 'healthy' | 'degraded' | 'untrained' | 'unknown';
  avg_response_time_ms?: number;
  movies_rated_today: number;
  model_versions: ModelVersionInfo[];
}

export interface ModelVersionInfo {
  version: string;
  accuracy?: number;
  trained_at?: string;
  algorithm: string;
  total_ratings_used?: number;
}

export interface AdminStats {
  total_users: number;
  total_movies: number;
  total_ratings: number;
  ratings_today: number;
  avg_rating: number;
  new_users_this_week: number;
  top_rated_movies: { id: number; title: string; avg_rating: number }[];
}
