import api from './api';
import type { WatchlistItem, FavoriteItem, RatingItem, Recommendation, Notification } from '../types/movie';

// ─── Ratings ────────────────────────────────────────────────────────────────
export const ratingService = {
  async rate(movie_id: number, rating: number): Promise<RatingItem> {
    const res = await api.post('/ratings', { movie_id, rating });
    return res.data;
  },
  async deleteRating(movie_id: number): Promise<void> {
    await api.delete(`/ratings/${movie_id}`);
  },
  async getMyRatings(): Promise<RatingItem[]> {
    const res = await api.get('/ratings/my');
    return res.data;
  },
};

// ─── Watchlist ───────────────────────────────────────────────────────────────
export const watchlistService = {
  async getWatchlist(): Promise<WatchlistItem[]> {
    const res = await api.get('/watchlist');
    return res.data;
  },
  async addToWatchlist(movie_id: number): Promise<WatchlistItem> {
    const res = await api.post('/watchlist', { movie_id });
    return res.data;
  },
  async updateStatus(movie_id: number, status: string): Promise<WatchlistItem> {
    const res = await api.patch(`/watchlist/${movie_id}/status`, { status });
    return res.data;
  },
  async removeFromWatchlist(movie_id: number): Promise<void> {
    await api.delete(`/watchlist/${movie_id}`);
  },
};

// ─── Favorites ───────────────────────────────────────────────────────────────
export const favoriteService = {
  async getFavorites(): Promise<FavoriteItem[]> {
    const res = await api.get('/favorites');
    return res.data;
  },
  async addFavorite(movie_id: number): Promise<FavoriteItem> {
    const res = await api.post('/favorites', { movie_id });
    return res.data;
  },
  async removeFavorite(movie_id: number): Promise<void> {
    await api.delete(`/favorites/${movie_id}`);
  },
};

// ─── Recommendations ─────────────────────────────────────────────────────────
export const recommendationService = {
  async getRecommendations(limit = 20): Promise<Recommendation> {
    const res = await api.get('/recommendations', { params: { limit } });
    return res.data;
  },
  async refreshRecommendations(limit = 20): Promise<Recommendation> {
    const res = await api.post('/recommendations/refresh', null, { params: { limit } });
    return res.data;
  },
  async getHistory(limit = 10): Promise<Recommendation[]> {
    const res = await api.get('/recommendations/history', { params: { limit } });
    return res.data;
  },
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    const res = await api.get('/users/me/notifications');
    return res.data;
  },
  async markRead(id: number): Promise<void> {
    await api.patch(`/users/me/notifications/${id}/read`);
  },
};

// ─── User ─────────────────────────────────────────────────────────────────────
export const userService = {
  async updateProfile(data: Record<string, unknown>): Promise<unknown> {
    const res = await api.put('/users/me', data);
    return res.data;
  },
  async changePassword(current_password: string, new_password: string): Promise<void> {
    await api.post('/users/me/change-password', { current_password, new_password });
  },
  async deleteAccount(): Promise<void> {
    await api.delete('/users/me');
  },
};

// ─── Admin ─────────────────────────────────────────────────────────────────────
export const adminService = {
  async getStats(): Promise<unknown> {
    const res = await api.get('/admin/stats');
    return res.data;
  },
  async getUsers(page = 1): Promise<unknown[]> {
    const res = await api.get('/admin/users', { params: { page } });
    return res.data;
  },
  async toggleUserActive(userId: number): Promise<void> {
    await api.patch(`/admin/users/${userId}/toggle-active`);
  },
  async getRatings(page = 1): Promise<unknown[]> {
    const res = await api.get('/admin/ratings', { params: { page } });
    return res.data;
  },
};

// ─── MLOps ────────────────────────────────────────────────────────────────────
export const mlopsService = {
  async getStatus(): Promise<unknown> {
    const res = await api.get('/mlops/status');
    return res.data;
  },
  async triggerRetrain(): Promise<{ message: string }> {
    const res = await api.post('/mlops/retrain');
    return res.data;
  },
  async getMonitorStats(): Promise<unknown> {
    const res = await api.get('/mlops/monitor');
    return res.data;
  },
  async getVersions(): Promise<unknown[]> {
    const res = await api.get('/mlops/versions');
    return res.data;
  },
};
