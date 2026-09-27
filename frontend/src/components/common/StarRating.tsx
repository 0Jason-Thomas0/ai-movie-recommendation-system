import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value?: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-7 h-7' };

export default function StarRating({ value = 0, onChange, readonly = false, size = 'md', showValue = false }: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {stars.map((star) => {
          const filled = (hover || value) >= star;
          return (
            <button
              key={star}
              type="button"
              disabled={readonly}
              onClick={() => !readonly && onChange?.(star)}
              onMouseEnter={() => !readonly && setHover(star)}
              onMouseLeave={() => !readonly && setHover(0)}
              className={`transition-all duration-100 ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110 active:scale-95'}`}
              aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
            >
              <Star
                className={`${sizes[size]} ${filled ? 'fill-accent-gold text-accent-gold' : 'text-white/30'} transition-colors duration-100`}
              />
            </button>
          );
        })}
      </div>
      {showValue && value > 0 && (
        <span className="text-accent-gold text-sm font-semibold ml-1">{value}/5</span>
      )}
    </div>
  );
}
