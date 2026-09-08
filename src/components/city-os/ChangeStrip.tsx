import { Link } from 'react-router-dom';
import { ChevronRight, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCityChanges } from '@/hooks/useCityChange';
import { eventTypeLabel } from '@/integrations/supabase/city-os';

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/**
 * "Toledo changed today", counted straight off the CityGraph change log.
 *
 * The window is seven days rather than one because a quiet Tuesday is normal
 * and an empty strip reads as a broken strip. The heading only claims today
 * when something actually happened today.
 */
export function ChangeStrip({ className }: { className?: string }) {
  const { data, isLoading, error } = useCityChanges(7);

  if (isLoading) {
    return <Skeleton className={'h-24 w-full rounded-xl ' + (className ?? '')} />;
  }

  // A network problem is not the same as a quiet week. Say nothing rather than
  // claim the city stood still.
  if (error || !data || data.length === 0) return null;

  const total = data.reduce((sum, row) => sum + row.change_count, 0);
  const today = data.filter((row) => isToday(row.latest_at));
  const heading = today.length > 0 ? 'Toledo changed today' : 'Toledo lately';
  const rows = (today.length > 0 ? today : data).slice(0, 4);

  return (
    <section className={className}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="flex items-center gap-2 font-heading text-base font-semibold">
          <Activity className="h-4 w-4 text-muted-foreground" />
          {heading}
        </h2>
        <Link to="/pulse" className="text-xs font-medium text-primary">
          See all
        </Link>
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {rows.map((row) => (
          <div
            key={row.event_type}
            className="min-w-[10.5rem] flex-1 rounded-xl border border-border/60 bg-card p-3"
          >
            <p className="text-lg font-semibold leading-none">{row.change_count}</p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              {eventTypeLabel(row.event_type)}
            </p>
            {row.latest_title && (
              <p className="mt-1.5 line-clamp-2 text-xs leading-snug text-muted-foreground">
                {row.latest_title}
              </p>
            )}
          </div>
        ))}
      </div>

      <Link
        to="/pulse"
        className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"
      >
        {total} {total === 1 ? 'change' : 'changes'} in the last seven days
        <ChevronRight className="h-3 w-3" />
      </Link>
    </section>
  );
}
