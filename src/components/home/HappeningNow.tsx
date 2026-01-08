import { useEvents } from '@/hooks/useEvents';
import { useDeals } from '@/hooks/useDeals';
import { Link } from 'react-router-dom';
import { Clock, MapPin, Ticket, Tag, Zap, ChevronRight } from 'lucide-react';
import { format, isToday, isTomorrow, differenceInHours } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export function HappeningNow() {
  const { data: events, isLoading: eventsLoading } = useEvents({ limit: 10 });
  const { data: deals, isLoading: dealsLoading } = useDeals({ limit: 6 });

  // Filter to events happening today or starting within 24 hours
  const happeningNow = events?.filter((event) => {
    const eventDate = new Date(event.start_date_time);
    const hoursUntil = differenceInHours(eventDate, new Date());
    return hoursUntil >= -2 && hoursUntil <= 24;
  }) || [];

  const isLoading = eventsLoading || dealsLoading;

  if (isLoading) {
    return (
      <section className="px-4 py-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (happeningNow.length === 0 && (!deals || deals.length === 0)) {
    return null;
  }

  return (
    <section className="px-4 py-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-toledo-rose animate-pulse" />
        <h2 className="font-bold text-lg">Happening Now</h2>
      </div>

      <div className="space-y-3">
        {/* Live Events */}
        {happeningNow.slice(0, 3).map((event) => {
          const eventDate = new Date(event.start_date_time);
          const hoursUntil = differenceInHours(eventDate, new Date());
          const isLive = hoursUntil <= 0 && hoursUntil >= -2;
          
          return (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border hover-lift"
            >
              {event.image_url && (
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {isLive ? (
                    <Badge className="bg-toledo-rose text-white text-xs px-1.5 py-0">
                      <Zap className="h-3 w-3 mr-0.5" /> LIVE
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {isToday(eventDate) ? 'Today' : isTomorrow(eventDate) ? 'Tomorrow' : format(eventDate, 'EEE')} {format(eventDate, 'h:mm a')}
                    </Badge>
                  )}
                </div>
                <h3 className="font-medium text-sm truncate">{event.title}</h3>
                <p className="text-xs text-muted-foreground truncate">
                  <MapPin className="h-3 w-3 inline mr-1" />
                  {event.location_text || 'Location TBD'}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </Link>
          );
        })}

        {/* Active Deals */}
        {deals?.slice(0, 2).map((deal) => (
          <div
            key={deal.id}
            className="flex items-center gap-3 p-3 bg-toledo-sage-light rounded-xl"
          >
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Tag className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate">{deal.title}</h3>
              <p className="text-xs text-muted-foreground truncate">
                {deal.business?.name || 'Local business'}
              </p>
            </div>
            <Badge variant="secondary" className="text-xs flex-shrink-0">
              Active
            </Badge>
          </div>
        ))}
      </div>

      <Link
        to="/events"
        className="flex items-center justify-center gap-1 mt-4 text-sm text-primary font-medium"
      >
        See all events <ChevronRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
