import { Link } from 'react-router-dom';
import { Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description?: string | null;
    start_date_time: string;
    location_text?: string | null;
    featured?: boolean | null;
    business?: {
      id: string;
      name: string;
      neighborhood?: { name: string } | null;
    } | null;
  };
  compact?: boolean;
}

export function EventCard({ event, compact = false }: EventCardProps) {
  const startDate = new Date(event.start_date_time);
  const day = format(startDate, 'd');
  const month = format(startDate, 'MMM').toUpperCase();
  const time = format(startDate, 'h:mm a');

  if (compact) {
    return (
      <Link to={`/events/${event.id}`} className="block group">
        <div className="card-elevated p-4 flex gap-4 hover:bg-secondary/30 transition-colors">
          {/* Date badge */}
          <div className="flex-shrink-0 w-12 h-14 rounded-lg bg-secondary flex flex-col items-center justify-center">
            <span className="text-[10px] font-semibold text-muted-foreground tracking-wide">{month}</span>
            <span className="text-lg font-semibold text-foreground leading-none">{day}</span>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground text-sm truncate group-hover:text-accent transition-colors">
              {event.title}
            </h3>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {time}
              </span>
              {event.location_text && (
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="h-3 w-3" />
                  {event.location_text}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/events/${event.id}`} className="block group">
      <div className="card-elevated p-4 flex gap-4 hover-lift">
        {/* Date badge */}
        <div className="flex-shrink-0 w-14 h-16 rounded-xl bg-secondary flex flex-col items-center justify-center">
          <span className="text-[10px] font-semibold text-muted-foreground tracking-wide">{month}</span>
          <span className="text-xl font-semibold text-foreground leading-none">{day}</span>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {event.featured && (
              <span className="text-[10px] font-semibold text-toledo-gold uppercase tracking-wide">
                Featured
              </span>
            )}
          </div>
          
          <h3 className="font-medium text-foreground group-hover:text-accent transition-colors">
            {event.title}
          </h3>
          
          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {format(startDate, 'EEEE')} at {time}
            </span>
          </div>
          
          {event.location_text && (
            <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate">{event.location_text}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
