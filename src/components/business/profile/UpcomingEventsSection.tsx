import { Calendar, MapPin, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { CollapsibleSection } from './CollapsibleSection';

interface Event {
  id: string;
  title: string;
  start_date_time: string;
  location_text?: string | null;
}

interface UpcomingEventsSectionProps {
  events?: Event[] | null;
}

export function UpcomingEventsSection({ events }: UpcomingEventsSectionProps) {
  if (!events || events.length === 0) return null;

  return (
    <CollapsibleSection title="Upcoming Events" icon={Calendar} defaultOpen>
      <div className="space-y-3">
        {events.slice(0, 3).map((event) => {
          const eventDate = new Date(event.start_date_time);
          
          return (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 border border-border/30 hover:bg-muted transition-colors"
            >
              {/* Date box */}
              <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                <span className="text-xs font-medium uppercase">
                  {format(eventDate, 'MMM')}
                </span>
                <span className="text-lg font-bold leading-none">
                  {format(eventDate, 'd')}
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground line-clamp-1">
                  {event.title}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <span>{format(eventDate, 'h:mm a')}</span>
                  {event.location_text && (
                    <>
                      <span>·</span>
                      <MapPin className="h-3 w-3" />
                      <span className="line-clamp-1">{event.location_text}</span>
                    </>
                  )}
                </div>
              </div>
              
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </Link>
          );
        })}
        
        {events.length > 3 && (
          <Link 
            to="/events" 
            className="flex items-center justify-center gap-1 py-2 text-sm text-primary hover:underline"
          >
            View all events
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </CollapsibleSection>
  );
}
