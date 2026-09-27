import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, Heart, Star, Zap, Clock, Film, TrendingUp, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { watchlistService, favoriteService, ratingService, recommendationService } from '../services/userService';
import type { WatchlistItem, FavoriteItem, RatingItem, Recommendation } from '../types/movie';
import MovieCarousel from '../components/movies/MovieCarousel';
import type { Movie } from '../types/movie';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [ratings, setRatings] = useState<RatingItem[]>([]);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    const load = async () => {
      try {
        const [wl, fav, rat, rec] = await Promise.all([
          watchlistService.getWatchlist(),
          favoriteService.getFavorites(),
          ratingService.getMyRatings(),
          recommendationService.getRecommendations(10).catch(() => null),
        ]);
        setWatchlist(wl);
        setFavorites(fav);
        setRatings(rat);
        setRecommendation(rec);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAuthenticated, navigate]);

  const avgRating = ratings.length > 0
    ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1)
    : null;

  const toWatchCount = watchlist.filter((w) => w.status === 'to_watch').length;
  const watchedCount = watchlist.filter((w) => w.status === 'watched').length;

  const recMovies: Movie[] = (recommendation?.items || []).map((item) => ({
    id: item.movie_id,
    title: item.movie_title,
    poster_url: item.movie_poster_url,
    release_year: item.movie_year,
    genres: item.movie_genres.map((g, i) => ({ id: i, name: g })),
    avg_rating: item.score ? item.score * 5 : 0,
    rating_count: 0,
    popularity: 0,
    is_trending: false,
    is_featured: false,
    created_at: new Date().toISOString(),
  }));

  return (
    <div className="min-h-screen bg-surface pt-20">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-2xl font-black text-white">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">
                Welcome back, <span className="text-primary">{user?.full_name?.split(' ')[0] || user?.username}</span>! 👋
              </h1>
              <p className="text-text-muted">Here's your movie activity overview</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Watchlist', value: watchlist.length, icon: Bookmark, color: 'text-blue-400', to: '/watchlist' },
            { label: 'Favorites', value: favorites.length, icon: Heart, color: 'text-red-400', to: '/favorites' },
            { label: 'Movies Rated', value: ratings.length, icon: Star, color: 'text-accent-gold', to: '/dashboard' },
            { label: 'Avg Rating', value: avgRating ? `${avgRating}★` : '—', icon: Award, color: 'text-accent-green', to: '/dashboard' },
          ].map((stat) => (
            <Link
              key={stat.label}
              to={stat.to}
              className="glass-card p-5 hover:bg-white/8 transition-all duration-200 group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-text-muted text-sm">{stat.label}</p>
                  <p className="text-3xl font-black text-white mt-1">{loading ? '...' : stat.value}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color} group-hover:scale-110 transition-transform`} />
              </div>
            </Link>
          ))}
        </div>

        {/* Watchlist Progress */}
        {watchlist.length > 0 && (
          <div className="glass-card p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" /> Watchlist Progress
              </h2>
              <Link to="/watchlist" className="text-primary text-sm hover:text-primary-light">View all →</Link>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[
                { label: 'To Watch', count: toWatchCount, color: 'bg-blue-500' },
                { label: 'Watching', count: watchlist.filter((w) => w.status === 'watching').length, color: 'bg-yellow-500' },
                { label: 'Watched', count: watchedCount, color: 'bg-accent-green' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl font-black text-white">{s.count}</p>
                  <p className="text-text-muted text-xs">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill bg-accent-green"
                style={{ width: watchlist.length > 0 ? `${(watchedCount / watchlist.length) * 100}%` : '0%' }}
              />
            </div>
            <p className="text-text-muted text-xs mt-1">
              {watchedCount} of {watchlist.length} watched ({Math.round((watchedCount / Math.max(watchlist.length, 1)) * 100)}%)
            </p>
          </div>
        )}

        {/* Favorite Genres */}
        {user?.favorite_genres && user.favorite_genres.length > 0 && (
          <div className="glass-card p-6 mb-8">
            <h2 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
              <Film className="w-5 h-5 text-primary" /> Your Favorite Genres
            </h2>
            <div className="flex flex-wrap gap-2">
              {user.favorite_genres.map((g) => (
                <Link key={g} to={`/search?genre=${encodeURIComponent(g)}`} className="genre-pill-active">
                  {g}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* AI Recommendations */}
        {recMovies.length > 0 ? (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">
                <Zap className="w-5 h-5 text-primary" /> AI Recommendations For You
              </h2>
              <Link to="/recommendations" className="text-primary text-sm hover:text-primary-light">See all →</Link>
            </div>
            <MovieCarousel title="" movies={recMovies} />
            {recommendation?.algorithm && (
              <p className="text-text-muted text-xs px-4 md:px-8 mt-1">
                Algorithm: <span className="text-white capitalize">{recommendation.algorithm.replace(/_/g, ' ')}</span>
                {recommendation.model_version && ` · Model v${recommendation.model_version}`}
              </p>
            )}
          </div>
        ) : ratings.length < 5 ? (
          <div className="glass-card p-8 text-center mb-8">
            <TrendingUp className="w-12 h-12 text-primary mx-auto mb-3" />
            <h3 className="text-white font-bold text-lg mb-2">Rate movies to unlock AI recommendations</h3>
            <p className="text-text-muted mb-4">
              You've rated {ratings.length}/5 movies. Rate {5 - ratings.length} more to activate personalized AI recommendations.
            </p>
            <Link to="/search" className="btn-primary">Browse & Rate Movies</Link>
          </div>
        ) : null}

        {/* Recent Favorites */}
        {favorites.length > 0 && (
          <div className="glass-card p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-400" /> Recently Liked
              </h2>
              <Link to="/favorites" className="text-primary text-sm">View all →</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {favorites.slice(0, 6).map((fav) => (
                <Link key={fav.id} to={`/movies/${fav.movie_id}`} className="group">
                  <div className="aspect-[2/3] rounded-lg overflow-hidden bg-surface-elevated">
                    <img
                      src={fav.movie_poster_url || 'https://via.placeholder.com/150x225/141414/444?text=🎬'}
                      alt={fav.movie_title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-xs text-text-secondary mt-1 line-clamp-1 group-hover:text-white transition-colors">
                    {fav.movie_title}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
