import { MapPin, Navigation, Clock, CalendarClock } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTruckStops } from '@/hooks/useTruckStops';
import { directionsUrl, statusLabel, TruckStop, TruckStopStatus } from '@/lib/truck-stops';

const STATUS_VARIANT: Record<TruckStopStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  open: 'default',
  sold_out: 'destructive',
  private: 'outline',
  closed: 'secondary',
};

function timeWindow(stop: TruckStop) {
  const start = new Date(stop.starts_at);
  const end = new Date(stop.ends_at);
  const day = isToday(start) ? 'Today' : format(start, 'EEE, MMM d');
  return `${day} · ${format(start, 'h:mm a')}–${format(end, 'h:mm a')}`;
}

export function ScheduleStopsBlock({ businessId }: { businessId: string }) {
  const { nowAt, nextStop, upcoming, isLoading } = useTruckStops(businessId);

  if (isLoading) return null;

  // The "headline" stop is wherever they are now, otherwise the next one.
  const headline = nowAt ?? nextStop;
  // Don't repeat the headline in the upcoming list.
  const rest = upcoming.filter((s) => s.id !== headline?.id);

  if (!headline && rest.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
        <div className="mb-1 flex items-center gap-2 font-semibold text-foreground">
          <CalendarClock className="h-4 w-4" /> Schedule
        </div>
        No upcoming stops posted yet. Follow to be the first to know.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {headline && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-primary">
              {nowAt ? 'Now at' : 'Next stop'}
            </span>
            <Badge variant={STATUS_VARIANT[headline.status]}>{statusLabel(headline.status)}</Badge>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="font-semibold text-foreground">{headline.location_name}</p>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> {timeWindow(headline)}
              </p>
            </div>
          </div>
          {headline.status !== 'private' && (
            <Button asChild variant="outline" size="sm" className="mt-3 w-full">
              <a href={directionsUrl(headline)} target="_blank" rel="noopener noreferrer">
                <Navigation className="mr-1.5 h-4 w-4" /> Get directions
              </a>
            </Button>
          )}
        </div>
      )}

      {rest.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Upcoming stops
          </p>
          <ul className="divide-y divide-border">
            {rest.map((stop) => (
              <li key={stop.id} className="flex items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{stop.location_name}</p>
                  <p className="text-xs text-muted-foreground">{timeWindow(stop)}</p>
                </div>
                {stop.status !== 'open' ? (
                  <Badge variant={STATUS_VARIANT[stop.status]} className="flex-shrink-0">
                    {statusLabel(stop.status)}
                  </Badge>
                ) : (
                  <a
                    href={directionsUrl(stop)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 text-muted-foreground hover:text-primary"
                    aria-label={`Directions to ${stop.location_name}`}
                  >
                    <Navigation className="h-4 w-4" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
