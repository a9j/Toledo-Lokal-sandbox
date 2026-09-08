import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Footprints, Car, BusFront, MapPin, TriangleAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useMyHome } from '@/hooks/useMyCity';
import { useJobsNearHome, JOB_FILTERS, type JobNearHome } from '@/hooks/useEconomy';

function payLabel(job: JobNearHome): string | null {
  const unit = job.pay_type === 'hourly' ? ' an hour' : job.pay_type === 'salary' ? ' a year' : '';
  if (job.pay_min && job.pay_max)
    return `$${job.pay_min} to $${job.pay_max}${unit}`;
  if (job.pay_min) return `from $${job.pay_min}${unit}`;
  if (job.pay_max) return `up to $${job.pay_max}${unit}`;
  return null;
}

const FILTER_LABEL = new Map(JOB_FILTERS.map((f) => [f.value as string, f.label]));

function JobRow({ job }: { job: JobNearHome }) {
  const pay = payLabel(job);

  return (
    <Link
      to={`/business/${job.business_id}`}
      className="block rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-border hover:bg-muted/40"
    >
      <p className="text-sm font-semibold leading-snug">{job.title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {[job.business_name, job.neighborhood_name, pay].filter(Boolean).join(' · ')}
      </p>

      {/* Travel is the thing that decides whether someone can take the job,
          so it goes above the perks rather than below them. */}
      {job.distance_miles !== null && (
        <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {job.distance_miles} mi
          </span>
          {job.walk_minutes !== null && job.walk_minutes <= 45 && (
            <span className="flex items-center gap-1">
              <Footprints className="h-3 w-3" />
              {job.walk_minutes} min walk
            </span>
          )}
          {job.bus_minutes !== null && (
            <span className="flex items-center gap-1">
              <BusFront className="h-3 w-3" />
              {job.bus_minutes} min bus
            </span>
          )}
          {job.drive_minutes !== null && (
            <span className="flex items-center gap-1">
              <Car className="h-3 w-3" />
              {job.drive_minutes} min drive
            </span>
          )}
        </div>
      )}

      {job.flags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {job.flags.map((flag) => (
            <Badge key={flag} variant="secondary" className="text-[10px]">
              {FILTER_LABEL.get(flag) ?? flag.replace(/_/g, ' ')}
            </Badge>
          ))}
        </div>
      )}
    </Link>
  );
}

/**
 * Jobs sorted by how far they are from your front door.
 *
 * The travel times are straight line estimates from speed constants, not routed
 * times. The note at the bottom says so, because someone working out whether
 * they can reach a shift deserves to know how rough the number is.
 */
export function JobsNearMe() {
  const { user } = useAuth();
  const { data: home } = useMyHome();
  const [filters, setFilters] = useState<string[]>([]);
  const { data: jobs, isLoading, error } = useJobsNearHome(filters);

  const toggle = (value: string) =>
    setFilters((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );

  return (
    <div>
      <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
        {JOB_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => toggle(f.value)}
            className={
              'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ' +
              (filters.includes(f.value)
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border/60 bg-card hover:bg-muted/40')
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {user && !home && (
        <div className="mb-4 rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">Add your address for travel times</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Then these sort by how far they are from you. Nobody else can see your address.
          </p>
          <Button asChild size="sm" variant="secondary" className="mt-3">
            <Link to="/my-city">Set my address</Link>
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : error ? (
        <div className="flex gap-3 rounded-xl border border-border/60 bg-muted/40 p-4">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Could not load jobs. Check your connection and try again.
          </p>
        </div>
      ) : !jobs || jobs.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {filters.length > 0
            ? 'Nothing matches all of those. Try dropping one.'
            : 'No jobs listed right now.'}
        </p>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <JobRow key={job.id} job={job} />
          ))}
        </div>
      )}

      {jobs && jobs.length > 0 && home && (
        <p className="mt-4 text-xs leading-snug text-muted-foreground">
          Travel times are rough estimates from straight line distance, not real routes. Check the
          bus timetable before you rely on one.
        </p>
      )}
    </div>
  );
}
