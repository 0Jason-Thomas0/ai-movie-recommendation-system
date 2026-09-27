import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Bookmark, Heart, Share2, Clock, Calendar, Globe, Play, ChevronLeft, Check, X } from 'lucide-react';
import type { Movie } from '../types/movie';
import { movieService } from '../services/movieService';
import { ratingService, watchlistService, favoriteService } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/common/StarRating';
import MovieCarousel from '../components/movies/MovieCarousel';
import toast from 'react-hot-toast';

const FALLBACK_BACKDROP = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&q=80';
const FALLBACK_POSTER = 'https://via.placeholder.com/300x450/141414/444?text=No+Poster';

export default function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [similar, setSimilar] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const [movieData, similarData] = await Promise.all([
          movieService.getMovie(parseInt(id)),
          movieService.getSimilarMovies(parseInt(id), 12),
        ]);
        setMovie(movieData);
        setSimilar(similarData);
        setRating(movieData.user_rating ?? 0);
        setIsWatchlisted(movieData.is_in_watchlist ?? false);
        setIsFavorited(movieData.is_favorited ?? false);
      } catch {
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    load();
    window.scrollTo(0, 0);
  }, [id, navigate]);

  const handleRate = async (value: number) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setRatingLoading(true);
    try {
      await ratingService.rate(movie!.id, value);
      setRating(value);
      toast.success(`Rated ${value} ⭐`);
      // Refresh to update avg
      const updated = await movieService.getMovie(movie!.id);
      setMovie(updated);
    } catch {
      toast.error('Failed to submit rating');
    } finally {
      setRatingLoading(false);
    }
  };

  const handleWatchlist = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    try {
      if (isWatchlisted) {
        await watchlistService.removeFromWatchlist(movie!.id);
        setIsWatchlisted(false);
        toast.success('Removed from watchlist');
      } else {
        await watchlistService.addToWatchlist(movie!.id);
        setIsWatchlisted(true);
        toast.success('Added to watchlist');
      }
    } catch (err: any) {
      if (err?.response?.status === 409) { setIsWatchlisted(true); }
      else toast.error('Something went wrong');
    }
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    try {
      if (isFavorited) {
        await favoriteService.removeFavorite(movie!.id);
        setIsFavorited(false);
        toast.success('Removed from favorites');
      } else {
        await favoriteService.addFavorite(movie!.id);
        setIsFavorited(true);
        toast.success('Added to favorites ❤️');
      }
    } catch (err: any) {
      if (err?.response?.status === 409) { setIsFavorited(true); }
      else toast.error('Something went wrong');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface pt-16 animate-pulse">
        <div className="skeleton h-[60vh] w-full" />
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 space-y-4">
          <div className="skeleton h-10 w-72 rounded" />
          <div className="skeleton h-4 w-48 rounded" />
          <div className="skeleton h-20 w-full max-w-2xl rounded" />
        </div>
      </div>
    );
  }

  if (!movie) return null;

  const castList = movie.cast ? movie.cast.split(',').map((c) => c.trim()).slice(0, 8) : [];

  return (
    <div className="min-h-screen bg-surface">
      {/* ─── Backdrop + Hero ─────────────────────────────────────────────── */}
      <div className="relative min-h-[60vh] flex items-end">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${movie.backdrop_url || FALLBACK_BACKDROP})` }}
        />
        <div className="hero-overlay absolute inset-0" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-20 left-4 md:left-8 z-20 btn-icon bg-black/60 backdrop-blur"
          aria-label="Go back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-8 pb-8 w-full">
          <div className="flex flex-wrap gap-2 mb-3">
            {movie.genres.slice(0, 4).map((g) => (
              <span key={g.id} className="badge badge-red">{g.name}</span>
            ))}
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-2 leading-tight max-w-3xl">
            {movie.title}
          </h1>
          {movie.tagline && (
            <p className="text-text-secondary italic mb-3">"{movie.tagline}"</p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
            {movie.release_year && <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{movie.release_year}</span>}
            {movie.runtime && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span>}
            {movie.language && <span className="flex items-center gap-1"><Globe className="w-4 h-4" />{movie.language.toUpperCase()}</span>}
            {movie.imdb_rating && (
              <span className="flex items-center gap-1 text-accent-gold font-semibold">
                <Star className="w-4 h-4 fill-current" />{movie.imdb_rating} IMDb
              </span>
            )}
            {movie.avg_rating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-white/50 fill-white/50" />
                {movie.avg_rating.toFixed(1)} CineAI ({movie.rating_count} ratings)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ─── Main Content ──────────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Poster + Actions */}
          <div className="lg:w-64 shrink-0">
            <img
              src={movie.poster_url || FALLBACK_POSTER}
              alt={movie.title}
              className="w-full max-w-[200px] mx-auto lg:max-w-none rounded-xl shadow-xl"
            />

            {/* Action Buttons */}
            <div className="mt-4 flex flex-col gap-2">
              {movie.trailer_key && (
                <button
                  onClick={() => setShowTrailer(true)}
                  className="btn-primary w-full justify-center"
                  id="play-trailer-btn"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Play Trailer
                </button>
              )}
              <button
                onClick={handleWatchlist}
                className={`w-full justify-center ${isWatchlisted ? 'btn-primary' : 'btn-secondary'}`}
                id="watchlist-btn"
              >
                {isWatchlisted ? <><Check className="w-4 h-4" /> In Watchlist</> : <><Bookmark className="w-4 h-4" /> Watchlist</>}
              </button>
              <button
                onClick={handleFavorite}
                className={`w-full justify-center ${isFavorited ? 'btn-primary' : 'btn-secondary'}`}
                id="favorite-btn"
              >
                <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                {isFavorited ? 'Liked' : 'Like'}
              </button>
              <button onClick={handleShare} className="btn-ghost w-full justify-center" id="share-btn">
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>

            {/* Rate This Movie */}
            <div className="mt-6 glass-card p-4 text-center">
              <p className="text-text-secondary text-xs uppercase tracking-wider mb-2">Your Rating</p>
              {ratingLoading ? (
                <div className="flex justify-center py-2">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <StarRating value={rating} onChange={handleRate} size="lg" showValue />
              )}
              {!isAuthenticated && (
                <p className="text-text-muted text-xs mt-2">Sign in to rate</p>
              )}
            </div>
          </div>

          {/* Right: Details */}
          <div className="flex-1 min-w-0">
            {/* Overview */}
            {movie.overview && (
              <div className="mb-6">
                <h2 className="text-white font-bold text-lg mb-2">Overview</h2>
                <p className="text-text-secondary leading-relaxed">{movie.overview}</p>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {movie.director && (
                <div className="glass-card p-3">
                  <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Director</p>
                  <p className="text-white text-sm font-medium">{movie.director}</p>
                </div>
              )}
              {movie.release_year && (
                <div className="glass-card p-3">
                  <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Year</p>
                  <p className="text-white text-sm font-medium">{movie.release_year}</p>
                </div>
              )}
              {movie.runtime && (
                <div className="glass-card p-3">
                  <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Runtime</p>
                  <p className="text-white text-sm font-medium">{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</p>
                </div>
              )}
              {movie.language && (
                <div className="glass-card p-3">
                  <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Language</p>
                  <p className="text-white text-sm font-medium">{movie.language.toUpperCase()}</p>
                </div>
              )}
              {movie.imdb_rating && (
                <div className="glass-card p-3">
                  <p className="text-text-muted text-xs uppercase tracking-wider mb-1">IMDb Rating</p>
                  <p className="text-accent-gold text-sm font-bold flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-current" />{movie.imdb_rating}/10
                  </p>
                </div>
              )}
              {movie.rating_count > 0 && (
                <div className="glass-card p-3">
                  <p className="text-text-muted text-xs uppercase tracking-wider mb-1">CineAI Rating</p>
                  <p className="text-white text-sm font-bold flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-white" />{movie.avg_rating.toFixed(1)}/5
                    <span className="text-text-muted font-normal">({movie.rating_count})</span>
                  </p>
                </div>
              )}
            </div>

            {/* Cast */}
            {castList.length > 0 && (
              <div className="mb-6">
                <h2 className="text-white font-bold text-lg mb-3">Cast</h2>
                <div className="flex flex-wrap gap-2">
                  {castList.map((actor) => (
                    <div key={actor} className="bg-surface-elevated border border-surface-border rounded-full px-3 py-1">
                      <span className="text-text-secondary text-sm">{actor}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Genres */}
            {movie.genres.length > 0 && (
              <div className="mb-6">
                <h2 className="text-white font-bold text-lg mb-3">Genres</h2>
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map((g) => (
                    <span key={g.id} className="badge badge-red text-sm px-3 py-1">{g.name}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Similar Movies */}
        {similar.length > 0 && (
          <div className="mt-12">
            <MovieCarousel title="Similar Movies" movies={similar} />
          </div>
        )}
      </div>

      {/* ─── Trailer Modal ─────────────────────────────────────────────── */}
      {showTrailer && movie.trailer_key && (
        <div className="modal-backdrop" onClick={() => setShowTrailer(false)}>
          <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end mb-2">
              <button onClick={() => setShowTrailer(false)} className="btn-icon">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative pb-[56.25%] h-0 overflow-hidden rounded-xl">
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={`https://www.youtube.com/embed/${movie.trailer_key}?autoplay=1&rel=0`}
                title={`${movie.title} Trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
