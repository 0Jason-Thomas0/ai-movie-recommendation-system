import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Info, TrendingUp, Star, Zap, Clock, Grid } from 'lucide-react';
import type { Movie } from '../types/movie';
import { movieService } from '../services/movieService';
import MovieCarousel from '../components/movies/MovieCarousel';
import { HeroSkeleton } from '../components/common/LoadingSkeleton';
import { useAuth } from '../context/AuthContext';

const FALLBACK_BACKDROP = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&q=80';

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [featured, setFeatured] = useState<Movie[]>([]);
  const [trending, setTrending] = useState<Movie[]>([]);
  const [topRated, setTopRated] = useState<Movie[]>([]);
  const [newReleases, setNewReleases] = useState<Movie[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroLoading, setHeroLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [featuredRes, trendingRes, topRatedRes, newRes] = await Promise.all([
          movieService.getFeatured(8),
          movieService.getTrending(20),
          movieService.getTopRated(20),
          movieService.getNewReleases(20),
        ]);
        setFeatured(featuredRes);
        setTrending(trendingRes);
        setTopRated(topRatedRes);
        setNewReleases(newRes);
      } finally {
        setHeroLoading(false);
        setLoading(false);
      }
    };
    load();
  }, []);

  // Auto-advance hero
  useEffect(() => {
    if (featured.length === 0) return;
    const timer = setInterval(() => {
      setHeroIndex((i) => (i + 1) % Math.min(featured.length, 5));
    }, 6000);
    return () => clearInterval(timer);
  }, [featured.length]);

  const hero = featured[heroIndex];

  return (
    <div className="min-h-screen bg-surface">
      {/* ─── Hero ───────────────────────────────────────────────────────── */}
      {heroLoading ? (
        <HeroSkeleton />
      ) : hero ? (
        <section className="relative min-h-[85vh] flex items-end overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
            style={{ backgroundImage: `url(${hero.backdrop_url || FALLBACK_BACKDROP})` }}
          />
          <div className="hero-overlay absolute inset-0" />

          {/* Content */}
          <div className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-8 pb-16 md:pb-24 w-full">
            {/* Genre tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {hero.genres.slice(0, 3).map((g) => (
                <span key={g.id} className="badge badge-red">{g.name}</span>
              ))}
              {hero.is_trending && (
                <span className="badge bg-white/10 text-white border border-white/20">🔥 Trending</span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-3 max-w-2xl leading-none drop-shadow-lg">
              {hero.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-text-secondary">
              {hero.release_year && <span>{hero.release_year}</span>}
              {hero.runtime && <span>{Math.floor(hero.runtime / 60)}h {hero.runtime % 60}m</span>}
              {hero.imdb_rating && (
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-accent-gold fill-accent-gold" />
                  <span className="text-accent-gold font-semibold">{hero.imdb_rating}</span>
                  <span className="text-text-muted">IMDb</span>
                </span>
              )}
              {hero.director && <span>Dir. {hero.director}</span>}
            </div>

            {/* Overview */}
            {hero.overview && (
              <p className="text-text-secondary text-sm md:text-base max-w-xl mb-6 line-clamp-3 leading-relaxed">
                {hero.overview}
              </p>
            )}

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate(`/movies/${hero.id}`)}
                className="btn-primary text-base px-8 py-3 shadow-glow-red"
              >
                <Play className="w-5 h-5 fill-current" />
                Watch Now
              </button>
              <button
                onClick={() => navigate(`/movies/${hero.id}`)}
                className="btn-secondary text-base px-8 py-3"
              >
                <Info className="w-5 h-5" />
                More Info
              </button>
            </div>
          </div>

          {/* Hero dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {featured.slice(0, 5).map((_, i) => (
              <button
                key={i}
                onClick={() => setHeroIndex(i)}
                className={`transition-all duration-300 rounded-full ${i === heroIndex ? 'w-8 h-2 bg-primary' : 'w-2 h-2 bg-white/40 hover:bg-white/60'}`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* ─── Genre Pills ───────────────────────────────────────────────── */}
      <GenrePillsSection />

      {/* ─── Carousels ─────────────────────────────────────────────────── */}
      <div className="mt-6">
        <MovieCarousel
          title="Trending Now"
          movies={trending}
          isLoading={loading}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <MovieCarousel
          title="Top Rated"
          movies={topRated}
          isLoading={loading}
          icon={<Star className="w-5 h-5" />}
        />
        <MovieCarousel
          title="New Releases"
          movies={newReleases}
          isLoading={loading}
          icon={<Zap className="w-5 h-5" />}
        />
      </div>

      {/* ─── AI Recommendation CTA ─────────────────────────────────────── */}
      {!isAuthenticated && (
        <section className="max-w-[1400px] mx-auto px-4 md:px-8 my-16">
          <div className="glass-card p-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/5 pointer-events-none" />
            <div className="relative z-10">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-3xl font-black text-white mb-3">Unlock AI Recommendations</h2>
              <p className="text-text-secondary max-w-md mx-auto mb-6">
                Rate movies, build your watchlist, and get personalized AI-powered recommendations that improve over time.
              </p>
              <div className="flex justify-center gap-3">
                <Link to="/signup" className="btn-primary px-8 py-3 text-base">Get Started Free</Link>
                <Link to="/login" className="btn-secondary px-8 py-3 text-base">Sign In</Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── Footer ────────────────────────────────────────────────────── */}
      <Footer />
    </div>
  );
}

function GenrePillsSection() {
  const navigate = useNavigate();
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);

  useEffect(() => {
    movieService.getGenres().then(setGenres).catch(() => {});
  }, []);

  const handleGenreClick = (name: string) => {
    setActiveGenre(name === activeGenre ? null : name);
    navigate(`/search?genre=${encodeURIComponent(name)}`);
  };

  if (genres.length === 0) return null;

  return (
    <div className="px-4 md:px-8 mt-8">
      <p className="text-text-secondary text-sm mb-3 font-medium uppercase tracking-wider">Browse by Genre</p>
      <div className="flex flex-wrap gap-2">
        {genres.map((g) => (
          <button
            key={g.id}
            onClick={() => handleGenreClick(g.name)}
            className={activeGenre === g.name ? 'genre-pill-active' : 'genre-pill'}
          >
            {g.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-surface-border mt-16 py-10 px-4 md:px-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-white">Cine<span className="text-primary">AI</span></span>
            <span className="text-text-muted text-sm">· AI-Powered Movie Recommendations</span>
          </div>
          <div className="flex items-center gap-6 text-text-muted text-sm">
            <Link to="/search" className="hover:text-white transition-colors">Browse</Link>
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link to="/signup" className="hover:text-white transition-colors">Sign Up</Link>
          </div>
          <p className="text-text-muted text-xs">© 2025 CineAI. Built with FastAPI + React.</p>
        </div>
      </div>
    </footer>
  );
}
