import { MapPin, Phone, Globe, Instagram, Clock } from 'lucide-react';

interface ContactCardProps {
  business: {
    address?: string | null;
    phone?: string | null;
    website?: string | null;
    instagram?: string | null;
    tiktok?: string | null;
    facebook?: string | null;
  };
  hours?: Record<string, { open: string; close: string; closed?: boolean } | null> | null;
}

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<string, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun'
};

const formatTime12hr = (time24: string): string => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export function ContactCard({ business, hours }: ContactCardProps) {
  const hasContact = business.address || business.phone || business.website || business.instagram;
  
  if (!hasContact && !hours) return null;

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/50">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
        Contact & Hours
      </h2>

      <div className="space-y-2">
        {/* Hours */}
        {hours && (
          <div className="mb-4 pb-4 border-b border-border/50">
            <div className="flex items-center gap-2 mb-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Hours</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm pl-6">
              {DAY_ORDER.map(day => {
                const dayHours = hours[day];
                const isClosed = !dayHours || dayHours.closed;
                return (
                  <div key={day} className="contents">
                    <span className="text-muted-foreground">{DAY_LABELS[day]}</span>
                    <span className="text-foreground">
                      {isClosed ? 'Closed' : `${formatTime12hr(dayHours.open)} - ${formatTime12hr(dayHours.close)}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Address */}
        {business.address && (
          <a 
            href={`https://maps.google.com/?q=${encodeURIComponent(business.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-foreground">{business.address}</span>
          </a>
        )}

        {/* Phone */}
        {business.phone && (
          <a 
            href={`tel:${business.phone}`}
            className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-foreground">{business.phone}</span>
          </a>
        )}

        {/* Website */}
        {business.website && (
          <a 
            href={business.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-foreground truncate">
              {business.website.replace(/^https?:\/\//, '')}
            </span>
          </a>
        )}

        {/* Instagram */}
        {business.instagram && (
          <a 
            href={`https://instagram.com/${business.instagram.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <Instagram className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-foreground">{business.instagram}</span>
          </a>
        )}

        {/* TikTok */}
        {business.tiktok && (
          <a 
            href={`https://tiktok.com/@${business.tiktok.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <svg className="h-4 w-4 text-muted-foreground flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
            </svg>
            <span className="text-sm text-foreground">{business.tiktok}</span>
          </a>
        )}

        {/* Facebook */}
        {business.facebook && (
          <a 
            href={`https://facebook.com/${business.facebook.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <svg className="h-4 w-4 text-muted-foreground flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span className="text-sm text-foreground">{business.facebook}</span>
          </a>
        )}
      </div>
    </div>
  );
}
