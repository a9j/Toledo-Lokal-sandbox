import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NonprofitFoundingBadgeProps {
  variant?: 'chip' | 'full';
  className?: string;
}

export function NonprofitFoundingBadge({ variant = 'chip', className }: NonprofitFoundingBadgeProps) {
  if (variant === 'full') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400',
          className,
        )}
      >
        <Heart className="h-3.5 w-3.5 fill-current" />
        Founding 5 Nonprofit
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-emerald-600 dark:text-emerald-400',
        className,
      )}
      title="Founding 5 Nonprofit"
    >
      <Heart className="h-2.5 w-2.5 fill-current" />
      Founding 5
    </span>
  );
}
