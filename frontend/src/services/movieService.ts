import api from './api';
import type { Movie, MovieSearchResponse, MovieFilters, Genre } from '../types/movie';

export const movieService = {
  async getMovies(filters: MovieFilters = {}): Promise<MovieSearchResponse> {
    const res = await api.get('/movies', { params: filters });
    return res.data;
  },

  async getMovie(id: number): Promise<Movie> {
    const res = await api.get(`/movies/${id}`);
    return res.data;
  },

  async getTrending(limit = 20): Promise<Movie[]> {
    const res = await api.get('/movies/trending', { params: { limit } });
    return res.data;
  },

  async getFeatured(limit = 10): Promise<Movie[]> {
    const res = await api.get('/movies/featured', { params: { limit } });
    return res.data;
  },

  async getTopRated(limit = 20): Promise<Movie[]> {
    const res = await api.get('/movies/top-rated', { params: { limit } });
    return res.data;
  },

  async getNewReleases(limit = 20): Promise<Movie[]> {
    const res = await api.get('/movies/new-releases', { params: { limit } });
    return res.data;
  },

  async getGenres(): Promise<Genre[]> {
    const res = await api.get('/movies/genres');
    return res.data;
  },

  async getSimilarMovies(id: number, limit = 10): Promise<Movie[]> {
    const res = await api.get(`/movies/${id}/similar`, { params: { limit } });
    return res.data;
  },

  async createMovie(data: Partial<Movie>): Promise<Movie> {
    const res = await api.post('/movies', data);
    return res.data;
  },

  async updateMovie(id: number, data: Partial<Movie>): Promise<Movie> {
    const res = await api.put(`/movies/${id}`, data);
    return res.data;
  },

  async deleteMovie(id: number): Promise<void> {
    await api.delete(`/movies/${id}`);
  },
};
