import { Link } from 'react-router-dom';
import { ChevronRight, Calendar } from 'lucide-react';
import { EventCardRich } from '@/components/cards/EventCardRich';
import { Skeleton } from '@/components/ui/skeleton';

interface EventItem {
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
}

interface EventsCarouselProps {
  title: string;
  subtitle?: string;
  events: EventItem[] | undefined;
  isLoading: boolean;
  viewAllLink?: string;
}

export function EventsCarousel({ title, subtitle, events, isLoading, viewAllLink }: EventsCarouselProps) {
  return (
    <section className="py-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 px-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="section-label">Happening Soon</span>
          </div>
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {viewAllLink && (
          <Link 
            to={viewAllLink} 
            className="flex items-center gap-0.5 text-sm font-medium text-primary hover:underline pt-1"
          >
            View all
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* Horizontal scroll */}
      {isLoading ? (
        <div className="flex gap-4 px-4 overflow-x-auto scrollbar-hide">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="w-72 h-64 rounded-2xl flex-shrink-0" />
          ))}
        </div>
      ) : events?.length ? (
        <div className="flex gap-4 px-4 overflow-x-auto scrollbar-hide pb-2">
          {events.map((event) => (
            <EventCardRich key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="px-4">
          <div className="card-elevated p-8 text-center">
            <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No upcoming events</p>
          </div>
        </div>
      )}
    </section>
  );
}
