import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface EventCardRichProps {
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
  variant?: 'horizontal' | 'vertical';
}

// Placeholder event images
const eventImages = [
  'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=300&fit=crop',
];

export function EventCardRich({ event, variant = 'vertical' }: EventCardRichProps) {
  const startDate = new Date(event.start_date_time);
  const imageUrl = eventImages[Math.floor(Math.random() * eventImages.length)];
  const timeUntil = formatDistanceToNow(startDate, { addSuffix: true });

  if (variant === 'horizontal') {
    return (
      <Link to={`/events/${event.id}`} className="block group">
        <div className="card-elevated p-3 hover-lift flex gap-4">
          {/* Date badge */}
          <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-toledo-coral flex flex-col items-center justify-center text-white shadow-soft">
            <span className="text-xs font-bold uppercase tracking-wide">
              {format(startDate, 'MMM')}
            </span>
            <span className="text-2xl font-bold leading-none">
              {format(startDate, 'd')}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 py-1">
            <div className="flex items-center gap-2 mb-1">
              {event.featured && (
                <span className="badge-featured text-[10px] py-0.5">Featured</span>
              )}
              <span className="text-xs text-muted-foreground">{timeUntil}</span>
            </div>
            
            <h3 className="font-bold text-foreground truncate group-hover:text-primary transition-colors">
              {event.title}
            </h3>
            
            <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{format(startDate, 'h:mm a')}</span>
              </div>
              {event.location_text && (
                <div className="flex items-center gap-1 truncate">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{event.location_text}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/events/${event.id}`} className="block group">
      <div className="card-elevated overflow-hidden hover-lift w-72 flex-shrink-0">
        {/* Image */}
        <div className="relative aspect-[3/2] overflow-hidden">
          <img
            src={imageUrl}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          
          {/* Date badge overlay */}
          <div className="absolute top-3 left-3 w-14 h-14 rounded-xl bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center shadow-soft">
            <span className="text-[10px] font-bold text-primary uppercase tracking-wide">
              {format(startDate, 'MMM')}
            </span>
            <span className="text-xl font-bold text-foreground leading-none">
              {format(startDate, 'd')}
            </span>
          </div>

          {event.featured && (
            <div className="absolute top-3 right-3">
              <span className="badge-featured">Featured</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {event.title}
          </h3>
          
          <div className="space-y-1.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span>{format(startDate, 'EEEE, h:mm a')}</span>
            </div>
            {event.location_text && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{event.location_text}</span>
              </div>
            )}
          </div>

          {/* RSVP hint */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">23 interested</span>
            <span className="ml-auto text-xs font-medium text-primary">RSVP →</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
