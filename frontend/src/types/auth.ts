export interface User {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  role: 'user' | 'admin' | 'guest';
  is_active: boolean;
  favorite_genres: string[];
  dark_mode: boolean;
  email_notifications: boolean;
  recommendation_notifications: boolean;
  created_at: string;
  last_login?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface SignupRequest {
  email: string;
  username: string;
  password: string;
  full_name?: string;
}
