import { 
  Clock, 
  MapPin, 
  Phone, 
  Globe, 
  Instagram, 
  ExternalLink,
  Facebook
} from 'lucide-react';
import { FlipCard } from '../FlipCard';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface AboutCardProps {
  business: {
    description?: string | null;
    address?: string | null;
    phone?: string | null;
    website?: string | null;
    instagram?: string | null;
    facebook?: string | null;
    tiktok?: string | null;
  };
  hours?: Record<string, { open: string; close: string; closed?: boolean } | null> | null;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<string, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun'
};

export function AboutCard({ business, hours }: AboutCardProps) {
  const today = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  const todayHours = hours?.[today];

  const formatTime = (time: string) => {
    const [hourStr, minStr] = time.split(':');
    let hour = parseInt(hourStr, 10);
    if (hour === 24) return '12:00 AM';
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minStr || '00'} ${period}`;
  };

  const formatHours = (h: { open: string; close: string; closed?: boolean } | null) => {
    if (!h || h.closed) return 'Closed';
    return `${formatTime(h.open)} - ${formatTime(h.close)}`;
  };

  const handleOpenMaps = () => {
    if (business.address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`, '_blank');
    }
  };

  const handleCall = () => {
    if (business.phone) {
      window.location.href = `tel:${business.phone}`;
    }
  };

  const handleOpenWebsite = () => {
    if (business.website) {
      const url = business.website.startsWith('http') ? business.website : `https://${business.website}`;
      window.open(url, '_blank');
    }
  };

  return (
    <FlipCard title="About">
      <div className="flex flex-col h-full space-y-6">
        {/* Description */}
        {business.description && (
          <p className="text-foreground leading-relaxed">
            {business.description}
          </p>
        )}

        {/* Today's Hours Highlight */}
        {hours && (
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-medium">Today's Hours</span>
              </div>
              <span className="font-semibold text-primary">
                {formatHours(todayHours)}
              </span>
            </div>
          </div>
        )}

        {/* Full Hours */}
        {hours && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Hours</h3>
            <div className="grid gap-1.5">
              {DAYS.map(day => (
                <div 
                  key={day}
                  className={`flex justify-between text-sm py-1 ${
                    day === today ? 'font-medium text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  <span>{DAY_LABELS[day]}</span>
                  <span>{formatHours(hours[day])}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Contact Actions */}
        <div className="space-y-3">
          {business.address && (
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={handleOpenMaps}
            >
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{business.address}</span>
              <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
            </Button>
          )}

          {business.phone && (
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={handleCall}
            >
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{business.phone}</span>
            </Button>
          )}

          {business.website && (
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={handleOpenWebsite}
            >
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{business.website.replace(/^https?:\/\//, '')}</span>
              <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
            </Button>
          )}
        </div>

        {/* Social Links */}
        {(business.instagram || business.facebook || business.tiktok) && (
          <div className="flex gap-2">
            {business.instagram && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.open(`https://instagram.com/${business.instagram.replace('@', '')}`, '_blank')}
              >
                <Instagram className="h-5 w-5" />
              </Button>
            )}
            {business.facebook && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.open(business.facebook?.startsWith('http') ? business.facebook : `https://facebook.com/${business.facebook}`, '_blank')}
              >
                <Facebook className="h-5 w-5" />
              </Button>
            )}
            {business.tiktok && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.open(`https://tiktok.com/@${business.tiktok.replace('@', '')}`, '_blank')}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </Button>
            )}
          </div>
        )}
      </div>
    </FlipCard>
  );
}
