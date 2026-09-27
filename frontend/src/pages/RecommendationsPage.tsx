import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, RefreshCw, History, Star, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { recommendationService } from '../services/userService';
import type { Recommendation } from '../types/movie';
import type { Movie } from '../types/movie';
import MovieCarousel from '../components/movies/MovieCarousel';
import toast from 'react-hot-toast';

export default function RecommendationsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [history, setHistory] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    const load = async () => {
      try {
        const [rec, hist] = await Promise.all([
          recommendationService.getRecommendations(20),
          recommendationService.getHistory(5),
        ]);
        setRecommendation(rec);
        setHistory(hist);
      } catch { /* no model trained yet */ }
      finally { setLoading(false); }
    };
    load();
  }, [isAuthenticated, navigate]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const rec = await recommendationService.refreshRecommendations(20);
      setRecommendation(rec);
      toast.success('Recommendations refreshed! ✨');
    } catch { toast.error('Could not refresh recommendations'); }
    finally { setRefreshing(false); }
  };

  const toMovies = (rec: Recommendation): Movie[] =>
    (rec?.items || []).map((item) => ({
      id: item.movie_id,
      title: item.movie_title,
      poster_url: item.movie_poster_url,
      release_year: item.movie_year,
      genres: item.movie_genres.map((g, i) => ({ id: i, name: g })),
      avg_rating: item.score ? parseFloat((item.score * 5).toFixed(1)) : 0,
      rating_count: 0,
      popularity: 0,
      is_trending: false,
      is_featured: false,
      created_at: new Date().toISOString(),
    }));

  return (
    <div className="min-h-screen bg-surface pt-20">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">AI Recommendations</h1>
              <p className="text-text-muted text-sm">Personalized just for you</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary gap-2"
            id="refresh-recommendations"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="skeleton aspect-[2/3] rounded-lg" />
            ))}
          </div>
        ) : recommendation && recommendation.items.length > 0 ? (
          <>
            {/* Algorithm info */}
            {recommendation.algorithm && (
              <div className="glass-card p-4 mb-6 flex items-center gap-3">
                <Info className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <p className="text-white text-sm">
                    Algorithm: <span className="font-semibold capitalize">{recommendation.algorithm.replace(/_/g, ' ')}</span>
                    {recommendation.model_version && (
                      <span className="text-text-muted"> · Model {recommendation.model_version}</span>
                    )}
                  </p>
                  <p className="text-text-muted text-xs">
                    Generated {new Date(recommendation.generated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {/* Movie grid with reasons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
              {recommendation.items.map((item) => (
                <div key={item.movie_id} className="group">
                  <Link to={`/movies/${item.movie_id}`}>
                    <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-surface-elevated">
                      <img
                        src={item.movie_poster_url || 'https://via.placeholder.com/200x300/141414/444?text=🎬'}
                        alt={item.movie_title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {item.score && (
                        <div className="absolute top-2 right-2 bg-black/70 rounded-full px-2 py-0.5 flex items-center gap-0.5">
                          <Star className="w-3 h-3 text-accent-gold fill-current" />
                          <span className="text-white text-xs font-bold">{(item.score * 5).toFixed(1)}</span>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white/80 text-xs line-clamp-2">{item.reason}</p>
                      </div>
                    </div>
                    <p className="text-white text-sm font-medium mt-1.5 line-clamp-1 group-hover:text-primary transition-colors">
                      {item.movie_title}
                    </p>
                    <p className="text-text-muted text-xs">{item.movie_year}</p>
                  </Link>
                </div>
              ))}
            </div>

            {/* Recommendation History */}
            <div className="glass-card p-6">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center justify-between w-full"
                id="toggle-history"
              >
                <h2 className="text-white font-bold text-lg flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" /> Recommendation History
                </h2>
                <span className="text-text-muted text-sm">{showHistory ? '▲' : '▼'}</span>
              </button>
              {showHistory && history.length > 0 && (
                <div className="mt-4 space-y-4">
                  {history.map((rec) => (
                    <div key={rec.id} className="border-t border-surface-border pt-4">
                      <p className="text-text-muted text-xs mb-2">
                        {new Date(rec.generated_at).toLocaleDateString()} · {rec.algorithm?.replace(/_/g, ' ')}
                      </p>
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {rec.items.slice(0, 8).map((item) => (
                          <Link key={item.movie_id} to={`/movies/${item.movie_id}`} className="shrink-0">
                            <img
                              src={item.movie_poster_url || 'https://via.placeholder.com/60x90/141414/444'}
                              alt={item.movie_title}
                              className="w-12 h-18 rounded object-cover hover:scale-105 transition-transform"
                              style={{ height: '72px' }}
                            />
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-24">
            <Zap className="w-16 h-16 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No recommendations yet</h3>
            <p className="text-text-muted mb-6 max-w-md mx-auto">
              Rate at least 5 movies to unlock AI-powered personalized recommendations.
              The more you rate, the better they get!
            </p>
            <Link to="/search" className="btn-primary">Browse & Rate Movies</Link>
          </div>
        )}
      </div>
    </div>
  );
}
