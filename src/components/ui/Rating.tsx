import { useState } from 'react';
import { Star } from 'lucide-react';

interface RatingProps {
  rating: number;
  maxStars?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

export const Rating = ({
  rating,
  maxStars = 5,
  interactive = false,
  onChange,
  size = 'md',
}: RatingProps) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const starSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6.5 h-6.5',
  };

  const getPriorityLabel = (stars: number) => {
    switch (stars) {
      case 1: return 'Low Priority';
      case 2: return 'Medium-Low Priority';
      case 3: return 'Medium Priority';
      case 4: return 'High Priority';
      case 5: return 'Critical Priority 🚨';
      default: return 'No Priority';
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        {Array.from({ length: maxStars }).map((_, index) => {
          const starValue = index + 1;
          const isFilled = hoverRating !== null ? starValue <= hoverRating : starValue <= rating;

          return (
            <button
              key={index}
              type="button"
              disabled={!interactive}
              onClick={() => onChange && onChange(starValue)}
              onMouseEnter={() => interactive && setHoverRating(starValue)}
              onMouseLeave={() => interactive && setHoverRating(null)}
              className={`transition-transform duration-150 ${
                interactive ? 'cursor-pointer hover:scale-115 active:scale-95' : 'pointer-events-none'
              }`}
            >
              <Star
                aria-hidden="true"
                className={`${starSizes[size]} ${
                  isFilled
                    ? 'fill-brand-accent text-brand-accent drop-shadow-[0_0_8px_rgba(139,92,246,0.4)]'
                    : 'text-text-secondary/20 fill-transparent'
                }`}
              />
            </button>
          );
        })}
      </div>
      {interactive && (
        <span className="text-[11px] font-semibold text-brand-accent transition-colors tracking-wide mt-0.5">
          {getPriorityLabel(hoverRating || rating)}
        </span>
      )}
    </div>
  );
};

