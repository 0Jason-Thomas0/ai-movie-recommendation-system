import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import type { Movie, Genre, MovieFilters } from '../types/movie';
import { movieService } from '../services/movieService';
import MovieCard from '../components/movies/MovieCard';
import { MovieGridSkeleton } from '../components/common/LoadingSkeleton';

const SORT_OPTIONS = [
  { value: 'popularity', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'year', label: 'Newest First' },
  { value: 'title', label: 'A–Z' },
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<MovieFilters>({
    query: searchParams.get('q') || '',
    genre: searchParams.get('genre') || '',
    sort_by: 'popularity',
    per_page: 24,
  });

  useEffect(() => {
    movieService.getGenres().then(setGenres).catch(() => {});
  }, []);

  const fetchMovies = useCallback(async (currentFilters: MovieFilters, currentPage: number) => {
    setLoading(true);
    try {
      const res = await movieService.getMovies({ ...currentFilters, page: currentPage });
      if (currentPage === 1) {
        setMovies(res.items);
      } else {
        setMovies((prev) => [...prev, ...res.items]);
      }
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    fetchMovies(filters, 1);
  }, [filters, fetchMovies]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const q = fd.get('q') as string;
    setFilters((f) => ({ ...f, query: q }));
    setSearchParams(q ? { q } : {});
  };

  const updateFilter = (key: keyof MovieFilters, value: string | number | undefined) => {
    setFilters((f) => ({ ...f, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ query: '', sort_by: 'popularity', per_page: 24 });
    setSearchParams({});
  };

  const loadMore = () => {
    if (page < totalPages && !loading) {
      const next = page + 1;
      setPage(next);
      fetchMovies(filters, next);
    }
  };

  const activeFilterCount = [filters.genre, filters.year_min, filters.year_max, filters.language, filters.rating_min]
    .filter(Boolean).length;

  return (
    <div className="min-h-screen bg-surface pt-20">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        {/* Search Header */}
        <div className="py-8">
          <h1 className="text-3xl font-bold text-white mb-6">
            {filters.query ? `Results for "${filters.query}"` : filters.genre ? `Genre: ${filters.genre}` : 'Browse Movies'}
          </h1>

          <form onSubmit={handleSearch} className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                name="q"
                type="text"
                defaultValue={filters.query}
                placeholder="Search by title, director, actor..."
                className="input-field pl-12 text-base"
                id="search-input"
              />
            </div>
            <button type="submit" className="btn-primary px-6">Search</button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary gap-2 relative ${showFilters ? 'border-primary text-primary' : ''}`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </form>

          {/* Filters Panel */}
          {showFilters && (
            <div className="glass-card p-6 mb-6 animate-slide-up">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Genre */}
                <div>
                  <label className="text-text-secondary text-xs uppercase tracking-wider mb-1.5 block">Genre</label>
                  <select
                    value={filters.genre || ''}
                    onChange={(e) => updateFilter('genre', e.target.value || undefined)}
                    className="input-field text-sm"
                    id="filter-genre"
                  >
                    <option value="">All Genres</option>
                    {genres.map((g) => <option key={g.id} value={g.name}>{g.name}</option>)}
                  </select>
                </div>

                {/* Year Min */}
                <div>
                  <label className="text-text-secondary text-xs uppercase tracking-wider mb-1.5 block">Year From</label>
                  <input
                    type="number"
                    min={1900} max={2025}
                    placeholder="1990"
                    value={filters.year_min || ''}
                    onChange={(e) => updateFilter('year_min', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="input-field text-sm"
                    id="filter-year-min"
                  />
                </div>

                {/* Year Max */}
                <div>
                  <label className="text-text-secondary text-xs uppercase tracking-wider mb-1.5 block">Year To</label>
                  <input
                    type="number"
                    min={1900} max={2025}
                    placeholder="2025"
                    value={filters.year_max || ''}
                    onChange={(e) => updateFilter('year_max', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="input-field text-sm"
                    id="filter-year-max"
                  />
                </div>

                {/* Min Rating */}
                <div>
                  <label className="text-text-secondary text-xs uppercase tracking-wider mb-1.5 block">Min Rating</label>
                  <select
                    value={filters.rating_min || ''}
                    onChange={(e) => updateFilter('rating_min', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="input-field text-sm"
                    id="filter-rating"
                  >
                    <option value="">Any Rating</option>
                    {[4.5, 4, 3.5, 3].map((r) => (
                      <option key={r} value={r}>⭐ {r}+</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <button onClick={clearFilters} className="text-text-muted hover:text-white text-sm flex items-center gap-1 transition-colors">
                  <X className="w-4 h-4" /> Clear all filters
                </button>
                <button onClick={() => setShowFilters(false)} className="btn-primary text-sm py-2">
                  Apply Filters
                </button>
              </div>
            </div>
          )}

          {/* Sort & Count */}
          <div className="flex items-center justify-between">
            <p className="text-text-muted text-sm">
              {loading ? 'Loading...' : `${total.toLocaleString()} movies found`}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-text-muted text-sm">Sort by:</span>
              <div className="relative">
                <select
                  value={filters.sort_by}
                  onChange={(e) => updateFilter('sort_by', e.target.value)}
                  className="bg-surface-elevated border border-surface-border text-white text-sm rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:ring-1 focus:ring-primary/50 appearance-none cursor-pointer"
                  id="sort-select"
                >
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-text-muted pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Movie Grid */}
        {loading && movies.length === 0 ? (
          <MovieGridSkeleton count={24} />
        ) : movies.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🎬</div>
            <h3 className="text-xl font-semibold text-white mb-2">No movies found</h3>
            <p className="text-text-muted mb-6">Try adjusting your search or filters</p>
            <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-8">
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} size="md" />
              ))}
            </div>

            {/* Load More */}
            {page < totalPages && (
              <div className="text-center pb-12">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="btn-secondary px-10 py-3"
                >
                  {loading ? 'Loading...' : `Load More (${total - movies.length} remaining)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
