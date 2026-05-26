import { useBusinessLocations, BusinessLocation } from '@/hooks/useBusinessLocations';
import { MapPin, Phone, Clock } from 'lucide-react';
import { BusinessMap } from '@/components/maps/BusinessMap';
import { useAuth } from '@/contexts/AuthContext';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const formatTime = (time: string) => {
  const [hourStr, minStr] = time.split(':');
  const hour = parseInt(hourStr, 10);
  if (hour === 24) return '12:00 AM';
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minStr || '00'} ${period}`;
};

function LocationCard({
  location,
  businessName,
  showMap,
}: {
  location: BusinessLocation;
  businessName?: string;
  showMap: boolean;
}) {
  const fullAddress = `${location.street_address}, ${location.city}, ${location.state} ${location.zip_code}`;
  const today = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  const todayHours = location.hours?.[today] as { open: string; close: string; closed?: boolean } | undefined;
  // Skip the map for virtual / address-less locations (and for signed-out
  // viewers, since the maps key requires a session in this app).
  const hasMappableAddress =
    showMap && !!location.street_address?.trim() && location.neighborhood !== 'Virtual';

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
      {hasMappableAddress && (
        <BusinessMap address={fullAddress} businessName={businessName} className="h-32 mt-1" />
      )}
    </div>
  );
}

interface LocationsSectionProps {
  businessId: string;
  businessName?: string;
}

export function LocationsSection({ businessId, businessName }: LocationsSectionProps) {
  const { data: locations } = useBusinessLocations(businessId);
  const { user } = useAuth();

  const activeLocations = (locations ?? []).filter((l) => l.is_active);

  // Show the section whenever the brand has at least one active location.
  if (activeLocations.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" />
        {activeLocations.length > 1 ? 'Locations' : 'Location'}
      </h3>
      <div className="space-y-2">
        {activeLocations.map((loc) => (
          <LocationCard key={loc.id} location={loc} businessName={businessName} showMap={!!user} />
        ))}
      </div>
    </div>
  );
}
