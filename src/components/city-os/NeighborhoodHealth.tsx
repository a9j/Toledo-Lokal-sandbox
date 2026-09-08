import { Skeleton } from '@/components/ui/skeleton';
import { useNeighborhoodStats } from '@/hooks/usePlatform';

interface NeighborhoodHealthProps {
  neighborhoodId: string;
  className?: string;
}

/**
 * The Health Dashboard for one neighborhood.
 *
 * Every number is a live count of something in the graph, not a score somebody
 * invented, and each tile says what it counts. A neighborhood with a lot of open
 * reports is not "unhealthy", it is a neighborhood where people report things,
 * so there is no composite index here and no traffic light: those invite a
 * reading the data cannot support.
 */
export function NeighborhoodHealth({ neighborhoodId, className }: NeighborhoodHealthProps) {
  const { data, isLoading, error } = useNeighborhoodStats(neighborhoodId);
  const stats = data?.[0];

  if (isLoading) {
    return <Skeleton className={'h-28 w-full rounded-xl ' + (className ?? '')} />;
  }
  if (error || !stats) return null;

  const tiles = [
    { value: stats.businesses, label: 'Businesses' },
    { value: stats.jobs_open, label: 'Jobs open' },
    { value: stats.events_upcoming, label: 'Events coming' },
    { value: stats.developments, label: 'Projects' },
    { value: stats.under_construction, label: 'Being built' },
    { value: stats.spaces_available, label: 'Space to rent' },
    { value: stats.issues_open, label: 'Reports open' },
    { value: stats.issues_completed, label: 'Reports done' },
    { value: stats.memories, label: 'Memories' },
    { value: stats.changes_30d, label: 'Changes, 30 days' },
  ];

  return (
    <section className={className}>
      <h2 className="mb-3 font-heading text-base font-semibold">
        {stats.neighborhood_name} by the numbers
      </h2>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl border border-border/60 bg-card p-3">
            <p className="text-lg font-semibold leading-none tabular-nums">{tile.value}</p>
            <p className="mt-1 text-[11px] leading-tight text-muted-foreground">{tile.label}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Counted live from what is listed here, not from a city index.
      </p>
    </section>
  );
}
