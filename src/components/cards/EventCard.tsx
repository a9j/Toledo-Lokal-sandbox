import { Link } from 'react-router-dom';
import { Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { imageSources } from '@/lib/entity-image';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description?: string | null;
    start_date_time: string;
    location_text?: string | null;
    featured?: boolean | null;
    image_url?: string | null;
    business?: {
      id: string;
      name: string;
      neighborhood?: { name: string } | null;
    } | null;
  };
  compact?: boolean;
}

/**
 * The picture, with the date sitting on it.
 *
 * The card used to be a date badge and two lines of text, which made a list of
 * forty events read as a spreadsheet. The date still has to survive at a glance,
 * so rather than putting the picture beside it, the badge moves on top: one
 * square that carries both. Events with no picture fall back to the kind tile,
 * so the column stays the same width either way and a list never goes ragged.
 */
function EventThumb({
  imageUrl,
  title,
  month,
  day,
  size,
}: {
  imageUrl?: string | null;
  title: string;
  month: string;
  day: string;
  size: 'sm' | 'md';
}) {
  const source = imageSources(imageUrl, 'event');
  const box = size === 'sm' ? 'h-14 w-14' : 'h-[4.5rem] w-[4.5rem]';

  return (
    <div className={`relative flex-shrink-0 overflow-hidden rounded-xl bg-secondary ${box}`}>
      <img
        src={source.src}
        alt={source.isPlaceholder ? '' : title}
        aria-hidden={source.isPlaceholder || undefined}
        loading="lazy"
        className="h-full w-full object-cover"
      />
      {/* The scrim is what keeps the date readable over a bright picture. */}
      <div className="absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-black/70 to-transparent" />
      <div className="absolute inset-x-0 top-0 flex flex-col items-center pt-1 leading-none text-white">
        <span className="text-[9px] font-semibold tracking-wide drop-shadow">{month}</span>
        <span className={`font-semibold drop-shadow ${size === 'sm' ? 'text-base' : 'text-lg'}`}>
          {day}
        </span>
      </div>
    </div>
  );
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
          <EventThumb
            imageUrl={event.image_url}
            title={event.title}
            month={month}
            day={day}
            size="sm"
          />

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
        <EventThumb
          imageUrl={event.image_url}
          title={event.title}
          month={month}
          day={day}
          size="md"
        />

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
