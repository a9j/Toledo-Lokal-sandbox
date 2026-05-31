import { Link } from 'react-router-dom';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryCardProps {
  id: string;
  name: string;
  icon: LucideIcon;
  count?: number;
  selected?: boolean;
  onClick?: () => void;
  linkTo?: string;
}

export function CategoryCard({
  id,
  name,
  icon: Icon,
  count,
  selected,
  onClick,
  linkTo,
}: CategoryCardProps) {
  const className = cn(
    'flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-card border transition-all min-h-[88px] p-2',
    selected
      ? 'border-primary bg-primary/5 shadow-sm'
      : 'border-border/60 hover:border-primary/40 hover:bg-primary/5'
  );

  const content = (
    <>
      <Icon
        className={cn('h-6 w-6', selected ? 'text-primary' : 'text-primary')}
        strokeWidth={1.8}
      />
      <span className="text-[11px] font-semibold text-foreground/90 text-center leading-tight px-0.5 line-clamp-2">
        {name}
      </span>
      {count !== undefined && count > 0 && (
        <span className="text-[10px] text-muted-foreground font-medium -mt-0.5">
          {count}
        </span>
      )}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }

  return (
    <Link to={linkTo ?? `/explore?category=${id}`} className={className}>
      {content}
    </Link>
  );
}
