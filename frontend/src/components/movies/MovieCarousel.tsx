import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Movie } from '../../types/movie';
import MovieCard from './MovieCard';
import { MovieCardSkeleton } from '../common/LoadingSkeleton';

interface MovieCarouselProps {
  title: string;
  movies: Movie[];
  isLoading?: boolean;
  cardSize?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export default function MovieCarousel({ title, movies, isLoading, cardSize = 'md', icon }: MovieCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'left' ? -400 : 400, behavior: 'smooth' });
    }
  };

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4 px-4 md:px-8">
        <h2 className="section-title">
          {icon && <span className="text-primary">{icon}</span>}
          {title}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="btn-icon"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="btn-icon"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-4 px-4 md:px-8 scrollbar-hide"
      >
        {isLoading
          ? Array.from({ length: 10 }).map((_, i) => <MovieCardSkeleton key={i} />)
          : movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} size={cardSize} />
            ))}
      </div>
    </section>
  );
}
