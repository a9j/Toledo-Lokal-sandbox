import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { useCallback, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useGoogleMapsKey } from '@/hooks/useGoogleMapsKey';

interface BusinessMapProps {
  address?: string | null;
  businessName?: string;
  className?: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 41.6528, // Toledo, OH center
  lng: -83.5379,
};

export function BusinessMap({ address, businessName, className = 'h-48' }: BusinessMapProps) {
  const { apiKey, isLoading: isLoadingKey, error: keyError } = useGoogleMapsKey();
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState(false);

  const onLoad = useCallback((map: google.maps.Map) => {
    if (!address) return;
    
    setIsGeocoding(true);
    const geocoder = new google.maps.Geocoder();
    
    geocoder.geocode({ address: `${address}, Toledo, OH` }, (results, status) => {
      setIsGeocoding(false);
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        setCoordinates({
          lat: location.lat(),
          lng: location.lng(),
        });
        map.setCenter(location);
        map.setZoom(15);
      } else {
        setGeocodeError(true);
      }
    });
  }, [address]);

  if (!address) {
    return null;
  }

  if (isLoadingKey) {
    return (
      <div className={`${className} rounded-xl overflow-hidden`}>
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  if (keyError || !apiKey) {
    return (
      <div className={`${className} rounded-xl bg-secondary flex items-center justify-center`}>
        <p className="text-sm text-muted-foreground">Map unavailable</p>
      </div>
    );
  }

  return (
    <div className={`${className} rounded-xl overflow-hidden relative`}>
      <LoadScript googleMapsApiKey={apiKey}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={coordinates || defaultCenter}
          zoom={coordinates ? 15 : 12}
          onLoad={onLoad}
          options={{
            disableDefaultUI: true,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }],
              },
            ],
          }}
        >
          {coordinates && (
            <Marker
              position={coordinates}
              title={businessName}
            />
          )}
        </GoogleMap>
      </LoadScript>
      
      {isGeocoding && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
          <Skeleton className="w-full h-full" />
        </div>
      )}
      
      {geocodeError && (
        <div className="absolute inset-0 bg-secondary/90 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Location not found</p>
        </div>
      )}
    </div>
  );
}
