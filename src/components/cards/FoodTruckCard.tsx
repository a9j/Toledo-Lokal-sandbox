import { Link } from 'react-router-dom';
import { MapPin, Clock, Utensils } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FoodTruckLocation } from '@/hooks/useFoodTruckLocations';
import { format, parse, isWithinInterval, addMinutes } from 'date-fns';

interface FoodTruckCardProps {
  location: FoodTruckLocation;
}

const formatTime12hr = (time: string): string => {
  if (!time) return '';
  try {
    const parsed = parse(time, 'HH:mm:ss', new Date());
    return format(parsed, 'h:mm a');
  } catch {
    return time;
  }
};

const isOpenNow = (startTime: string, endTime: string): boolean => {
  try {
    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');
    const start = parse(`${today} ${startTime}`, 'yyyy-MM-dd HH:mm:ss', new Date());
    const end = parse(`${today} ${endTime}`, 'yyyy-MM-dd HH:mm:ss', new Date());
    return isWithinInterval(now, { start, end });
  } catch {
    return false;
  }
};

export function FoodTruckCard({ location }: FoodTruckCardProps) {
  const openNow = isOpenNow(location.start_time, location.end_time);

  return (
    <Link to={location.business ? `/business/${location.business.id}` : '#'} className="block group">
      <div className="card-elevated overflow-hidden hover:bg-secondary/30 transition-colors">
        {/* Image */}
        {location.business?.photos?.[0] && (
          <div className="aspect-[16/9] overflow-hidden">
            <img 
              src={location.business.photos[0]} 
              alt={location.business.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              {/* Logo */}
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center overflow-hidden">
                {location.business?.logo_url ? (
                  <img 
                    src={location.business.logo_url} 
                    alt={location.business.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Utensils className="h-4 w-4 text-accent" />
                )}
              </div>
              
              <div className="min-w-0">
                <h3 className="font-medium text-foreground text-sm truncate group-hover:text-accent transition-colors">
                  {location.business?.name || 'Food Vendor'}
                </h3>
                {location.business?.category && (
                  <p className="text-xs text-muted-foreground truncate">
                    {location.business.category.name}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {openNow && (
                <Badge variant="secondary" className="bg-success/10 text-success text-[10px] px-1.5">
                  Open Now
                </Badge>
              )}
              {location.featured && (
                <span className="text-[10px] font-semibold text-toledo-gold uppercase tracking-wide">
                  Featured
                </span>
              )}
            </div>
          </div>
          
          {/* Location & Time */}
          <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-start gap-1.5">
              <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-1">{location.location_name}</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{formatTime12hr(location.start_time)} – {formatTime12hr(location.end_time)}</span>
            </div>
          </div>
          
          {/* Notes */}
          {location.notes && (
            <p className="mt-2 text-xs text-muted-foreground line-clamp-2 italic">
              {location.notes}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
