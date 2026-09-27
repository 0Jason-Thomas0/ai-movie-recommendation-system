import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, Check, Eye, Trash2, Clock, SortAsc } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { watchlistService } from '../services/userService';
import type { WatchlistItem } from '../types/movie';
import toast from 'react-hot-toast';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  to_watch: { label: 'To Watch', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  watching: { label: 'Watching', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
  watched: { label: 'Watched', color: 'text-accent-green bg-accent-green/10 border-accent-green/30' },
};

export default function WatchlistPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [sort, setSort] = useState<string>('newest');

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    watchlistService.getWatchlist().then(setItems).finally(() => setLoading(false));
  }, [isAuthenticated, navigate]);

  const updateStatus = async (movieId: number, status: string) => {
    try {
      const updated = await watchlistService.updateStatus(movieId, status);
      setItems((prev) => prev.map((i) => i.movie_id === movieId ? { ...i, status: updated.status } : i));
      toast.success(`Status updated to "${STATUS_LABELS[status].label}"`);
    } catch { toast.error('Failed to update status'); }
  };

  const removeItem = async (movieId: number) => {
    try {
      await watchlistService.removeFromWatchlist(movieId);
      setItems((prev) => prev.filter((i) => i.movie_id !== movieId));
      toast.success('Removed from watchlist');
    } catch { toast.error('Failed to remove'); }
  };

  const filtered = items
    .filter((i) => filter === 'all' || i.status === filter)
    .sort((a, b) => sort === 'newest'
      ? new Date(b.added_at).getTime() - new Date(a.added_at).getTime()
      : a.movie_title?.localeCompare(b.movie_title || '') || 0
    );

  return (
    <div className="min-h-screen bg-surface pt-20">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Bookmark className="w-7 h-7 text-primary" />
          <h1 className="text-3xl font-black text-white">My Watchlist</h1>
          <span className="badge bg-white/10 text-white border border-white/20 text-base">{items.length}</span>
        </div>

        {/* Filters & Sort */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex gap-2">
            {['all', 'to_watch', 'watching', 'watched'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-sm px-3 py-1.5 rounded-full border transition-all ${filter === f ? 'border-primary bg-primary/10 text-primary' : 'border-surface-border text-text-muted hover:border-white/30 hover:text-white'}`}
              >
                {f === 'all' ? 'All' : STATUS_LABELS[f].label}
                <span className="ml-1.5 text-xs opacity-70">
                  ({f === 'all' ? items.length : items.filter((i) => i.status === f).length})
                </span>
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <SortAsc className="w-4 h-4 text-text-muted" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-surface-elevated border border-surface-border text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none"
              id="watchlist-sort"
            >
              <option value="newest">Newest First</option>
              <option value="title">A–Z</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-28 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Bookmark className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {filter === 'all' ? 'Your watchlist is empty' : `No ${STATUS_LABELS[filter].label} movies`}
            </h3>
            <p className="text-text-muted mb-6">Start adding movies to track what you want to watch</p>
            <Link to="/search" className="btn-primary">Browse Movies</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <div key={item.id} className="glass-card p-4 flex gap-4 hover:bg-white/5 transition-colors group">
                {/* Poster */}
                <Link to={`/movies/${item.movie_id}`} className="shrink-0">
                  <img
                    src={item.movie_poster_url || 'https://via.placeholder.com/80x120/141414/444?text=🎬'}
                    alt={item.movie_title}
                    className="w-16 h-24 object-cover rounded-lg"
                  />
                </Link>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link to={`/movies/${item.movie_id}`}>
                    <p className="text-white font-semibold line-clamp-1 hover:text-primary transition-colors">{item.movie_title}</p>
                  </Link>
                  <p className="text-text-muted text-xs mb-2">{item.movie_year}</p>
                  {/* Status badge */}
                  <span className={`badge border text-xs ${STATUS_LABELS[item.status]?.color}`}>
                    {STATUS_LABELS[item.status]?.label}
                  </span>
                  {/* Actions */}
                  <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.status !== 'to_watch' && (
                      <button onClick={() => updateStatus(item.movie_id, 'to_watch')} title="Mark as To Watch"
                        className="p-1 rounded text-text-muted hover:text-blue-400 hover:bg-blue-500/10 transition-colors text-xs flex items-center gap-0.5">
                        <Clock className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {item.status !== 'watching' && (
                      <button onClick={() => updateStatus(item.movie_id, 'watching')} title="Mark as Watching"
                        className="p-1 rounded text-text-muted hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {item.status !== 'watched' && (
                      <button onClick={() => updateStatus(item.movie_id, 'watched')} title="Mark as Watched"
                        className="p-1 rounded text-text-muted hover:text-accent-green hover:bg-accent-green/10 transition-colors">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => removeItem(item.movie_id)} title="Remove"
                      className="p-1 rounded text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors ml-auto">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
