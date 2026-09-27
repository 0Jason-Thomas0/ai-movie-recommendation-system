import api from './api';
import type { AuthTokens, LoginRequest, SignupRequest, User } from '../types/auth';

export const authService = {
  async login(data: LoginRequest): Promise<AuthTokens> {
    const res = await api.post('/auth/login', data);
    return res.data;
  },

  async signup(data: SignupRequest): Promise<AuthTokens> {
    const res = await api.post('/auth/signup', data);
    return res.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout').catch(() => {});
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  async getMe(): Promise<User> {
    const res = await api.get('/auth/me');
    return res.data;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },

  async resetPassword(token: string, new_password: string): Promise<{ message: string }> {
    const res = await api.post('/auth/reset-password', { token, new_password });
    return res.data;
  },

  storeTokens(tokens: AuthTokens) {
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
  },

  clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  },
};
