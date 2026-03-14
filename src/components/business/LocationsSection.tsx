import { useBusinessLocations, BusinessLocation } from '@/hooks/useBusinessLocations';
import { MapPin, Phone, Clock } from 'lucide-react';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const formatTime = (time: string) => {
  const [hourStr, minStr] = time.split(':');
  let hour = parseInt(hourStr, 10);
  if (hour === 24) return '12:00 AM';
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minStr || '00'} ${period}`;
};

function LocationCard({ location }: { location: BusinessLocation }) {
  const fullAddress = `${location.street_address}, ${location.city}, ${location.state} ${location.zip_code}`;
  const today = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  const todayHours = location.hours?.[today] as { open: string; close: string; closed?: boolean } | undefined;

  return (
    <div className="rounded-xl border border-border p-4 space-y-2">
      {location.label && (
        <h4 className="font-semibold text-sm">{location.label}</h4>
      )}
      <div className="flex items-start gap-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <span>{fullAddress}</span>
      </div>
      {location.phone && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="h-4 w-4 flex-shrink-0" />
          <a href={`tel:${location.phone}`} className="hover:text-foreground">{location.phone}</a>
        </div>
      )}
      {todayHours && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 flex-shrink-0" />
          <span>
            {todayHours.closed
              ? 'Closed today'
              : `Today: ${formatTime(todayHours.open)} – ${formatTime(todayHours.close)}`}
          </span>
        </div>
      )}
    </div>
  );
}

interface LocationsSectionProps {
  businessId: string;
}

export function LocationsSection({ businessId }: LocationsSectionProps) {
  const { data: locations } = useBusinessLocations(businessId);

  // Don't show section if 0 or 1 locations
  if (!locations || locations.length <= 1) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" />
        Locations
      </h3>
      <div className="space-y-2">
        {locations
          .filter((l) => l.is_active)
          .map((loc) => (
            <LocationCard key={loc.id} location={loc} />
          ))}
      </div>
    </div>
  );
}
