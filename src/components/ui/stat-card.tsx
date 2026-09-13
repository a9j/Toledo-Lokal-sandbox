import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
  value: string | number;
  label: string;
  icon?: LucideIcon;
  /** Positive shows an up arrow, negative a down arrow, zero or undefined shows none. */
  trend?: number;
  trendLabel?: string;
  loading?: boolean;
  className?: string;
}

/**
 * One number, said plainly.
 *
 * The number is the loudest thing in the card and the label is quiet under it,
 * because someone scanning a row of these is reading the numbers first.
 */
export function StatCard({
  value,
  label,
  icon: Icon,
  trend,
  trendLabel,
  loading = false,
  className,
}: StatCardProps) {
  if (loading) {
    return <Skeleton className={cn('h-[92px] rounded-2xl', className)} />;
  }

  const up = typeof trend === 'number' && trend > 0;
  const down = typeof trend === 'number' && trend < 0;

  return (
    <div
      className={cn(
        'rounded-2xl border border-border/60 bg-card p-4 shadow-sm',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          {value}
        </span>
        {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      {(up || down) && (
        <p
          className={cn(
            'mt-1.5 flex items-center gap-1 text-xs font-medium',
            up ? 'text-success' : 'text-destructive',
          )}
        >
          {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {trendLabel ?? `${up ? '+' : ''}${trend}`}
        </p>
      )}
    </div>
  );
}
