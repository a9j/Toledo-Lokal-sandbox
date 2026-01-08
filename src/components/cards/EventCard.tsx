import { Link } from 'react-router-dom';
import { Calendar, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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

  if (compact) {
    return (
      <Link to={`/events/${event.id}`} className="block">
        <div className="card-elevated p-3 hover-lift flex items-center gap-3">
          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center">
            <span className="text-xs font-medium text-primary uppercase">
              {format(startDate, 'MMM')}
            </span>
            <span className="text-lg font-bold text-primary">
              {format(startDate, 'd')}
            </span>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground truncate">{event.title}</h3>
            <p className="text-sm text-muted-foreground truncate">
              {format(startDate, 'h:mm a')}
              {event.location_text && ` · ${event.location_text}`}
            </p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/events/${event.id}`} className="block">
      <div className="card-elevated p-4 hover-lift">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-primary/10 flex flex-col items-center justify-center">
            <span className="text-xs font-medium text-primary uppercase">
              {format(startDate, 'MMM')}
            </span>
            <span className="text-2xl font-bold text-primary">
              {format(startDate, 'd')}
            </span>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {event.featured && (
                <Badge variant="secondary" className="bg-warning/10 text-warning text-[10px] px-1.5">
                  Featured
                </Badge>
              )}
            </div>
            
            <h3 className="font-semibold text-foreground">{event.title}</h3>
            
            <div className="flex flex-col gap-1 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>{format(startDate, 'EEEE, h:mm a')}</span>
              </div>
              {event.location_text && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate">{event.location_text}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
