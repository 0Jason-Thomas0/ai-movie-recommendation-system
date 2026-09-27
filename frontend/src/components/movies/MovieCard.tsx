import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Plus, Heart, Check, Play } from 'lucide-react';
import type { Movie } from '../../types/movie';
import { watchlistService, favoriteService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface MovieCardProps {
  movie: Movie;
  size?: 'sm' | 'md' | 'lg';
}

const FALLBACK_POSTER = 'https://via.placeholder.com/300x450/141414/444?text=No+Poster';

export default function MovieCard({ movie, size = 'md' }: MovieCardProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isWatchlisted, setIsWatchlisted] = useState(movie.is_in_watchlist ?? false);
  const [isFavorited, setIsFavorited] = useState(movie.is_favorited ?? false);
  const [loading, setLoading] = useState(false);

  const sizeClasses = {
    sm: 'w-32 md:w-36',
    md: 'w-36 md:w-44',
    lg: 'w-44 md:w-52',
  };

  const handleWatchlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) { navigate('/login'); return; }
    setLoading(true);
    try {
      if (isWatchlisted) {
        await watchlistService.removeFromWatchlist(movie.id);
        setIsWatchlisted(false);
        toast.success('Removed from watchlist');
      } else {
        await watchlistService.addToWatchlist(movie.id);
        setIsWatchlisted(true);
        toast.success('Added to watchlist');
      }
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setIsWatchlisted(true);
      } else {
        toast.error('Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) { navigate('/login'); return; }
    try {
      if (isFavorited) {
        await favoriteService.removeFavorite(movie.id);
        setIsFavorited(false);
        toast.success('Removed from favorites');
      } else {
        await favoriteService.addFavorite(movie.id);
        setIsFavorited(true);
        toast.success('Added to favorites ❤️');
      }
    } catch (err: any) {
      if (err?.response?.status === 409) setIsFavorited(true);
      else toast.error('Something went wrong');
    }
  };

  const posterUrl = movie.poster_url || FALLBACK_POSTER;

  return (
    <div
      className={`movie-card ${sizeClasses[size]} shrink-0 group`}
      onClick={() => navigate(`/movies/${movie.id}`)}
      role="button"
      aria-label={`View ${movie.title}`}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] bg-surface-card rounded-lg overflow-hidden">
        <img
          src={posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_POSTER; }}
          loading="lazy"
        />

        {/* Overlay */}
        <div className="card-overlay rounded-lg">
          <div className="flex justify-between items-end">
            <div className="flex gap-1.5">
              {/* Watchlist */}
              <button
                onClick={handleWatchlist}
                disabled={loading}
                className={`p-1.5 rounded-full transition-all duration-200 ${isWatchlisted ? 'bg-primary text-white' : 'bg-black/60 text-white hover:bg-white/20'}`}
                title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
              >
                {isWatchlisted ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              </button>
              {/* Favorite */}
              <button
                onClick={handleFavorite}
                className={`p-1.5 rounded-full transition-all duration-200 ${isFavorited ? 'bg-red-500 text-white' : 'bg-black/60 text-white hover:bg-white/20'}`}
                title={isFavorited ? 'Unlike' : 'Like'}
              >
                <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-current' : ''}`} />
              </button>
            </div>
            {/* Play button */}
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/movies/${movie.id}`); }}
              className="p-1.5 rounded-full bg-white text-black hover:bg-white/90 transition-all"
              title="View Details"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>
        </div>

        {/* Trending badge */}
        {movie.is_trending && (
          <div className="absolute top-2 left-2 badge-red text-[10px] px-1.5 py-0.5 rounded-full font-bold">
            TRENDING
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-2 px-1">
        <p className="text-white text-sm font-semibold leading-tight line-clamp-1 group-hover:text-primary transition-colors">
          {movie.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-text-muted text-xs">{movie.release_year}</span>
          {movie.avg_rating > 0 && (
            <div className="flex items-center gap-0.5">
              <Star className="w-3 h-3 text-accent-gold fill-accent-gold" />
              <span className="text-accent-gold text-xs font-medium">{movie.avg_rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        {movie.genres.length > 0 && (
          <p className="text-text-muted text-xs mt-0.5 line-clamp-1">
            {movie.genres.slice(0, 2).map((g) => g.name).join(' · ')}
          </p>
        )}
      </div>
    </div>
  );
}
