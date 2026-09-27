import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { favoriteService } from '../services/userService';
import type { FavoriteItem } from '../types/movie';
import toast from 'react-hot-toast';

export default function FavoritesPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    favoriteService.getFavorites().then(setFavorites).finally(() => setLoading(false));
  }, [isAuthenticated, navigate]);

  const removeFavorite = async (movieId: number) => {
    try {
      await favoriteService.removeFavorite(movieId);
      setFavorites((prev) => prev.filter((f) => f.movie_id !== movieId));
      toast.success('Removed from favorites');
    } catch { toast.error('Failed to remove'); }
  };

  return (
    <div className="min-h-screen bg-surface pt-20">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-7 h-7 text-red-400 fill-current" />
          <h1 className="text-3xl font-black text-white">Liked Movies</h1>
          <span className="badge bg-white/10 text-white border border-white/20 text-base">{favorites.length}</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="skeleton aspect-[2/3] rounded-lg" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No liked movies yet</h3>
            <p className="text-text-muted mb-6">Heart a movie to add it here</p>
            <Link to="/search" className="btn-primary">Browse Movies</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {favorites.map((fav) => (
              <div key={fav.id} className="group relative">
                <Link to={`/movies/${fav.movie_id}`}>
                  <div className="aspect-[2/3] rounded-lg overflow-hidden bg-surface-elevated">
                    <img
                      src={fav.movie_poster_url || 'https://via.placeholder.com/200x300/141414/444?text=🎬'}
                      alt={fav.movie_title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-white text-sm font-medium mt-2 line-clamp-1 group-hover:text-primary transition-colors">
                    {fav.movie_title}
                  </p>
                </Link>
                <button
                  onClick={() => removeFavorite(fav.movie_id)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                  title="Unlike"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
