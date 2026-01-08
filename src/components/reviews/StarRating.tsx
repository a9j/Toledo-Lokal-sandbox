import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
  showValue?: boolean;
  className?: string;
}

export function StarRating({ 
  rating, 
  maxRating = 5, 
  size = 'md',
  interactive = false,
  onChange,
  showValue = false,
  className
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-6 w-6'
  };

  const handleClick = (index: number) => {
    if (interactive && onChange) {
      onChange(index + 1);
    }
  };

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: maxRating }).map((_, index) => {
        const filled = index < Math.floor(rating);
        const halfFilled = !filled && index < rating;
        
        return (
          <button
            key={index}
            type="button"
            onClick={() => handleClick(index)}
            disabled={!interactive}
            className={cn(
              'transition-colors',
              interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                filled || halfFilled ? 'fill-warning text-warning' : 'text-muted-foreground/30'
              )}
            />
          </button>
        );
      })}
      {showValue && (
        <span className="ml-1.5 text-sm font-medium text-muted-foreground">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
