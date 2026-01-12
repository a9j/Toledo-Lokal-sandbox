import { useState, useMemo, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { useFoodTruckLocations } from '@/hooks/useFoodTruckLocations';
import { FoodTruckCard } from '@/components/cards/FoodTruckCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, List, Map as MapIcon, Utensils, ChevronLeft, ChevronRight } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { format, addDays, subDays, isToday, isTomorrow } from 'date-fns';
import { GoogleMap, useLoadScript, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { useGoogleMapsKey } from '@/hooks/useGoogleMapsKey';
import { Link } from 'react-router-dom';

type ViewMode = 'list' | 'map';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 41.6528,
  lng: -83.5379,
};

export default function FoodToday() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  
  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const { data: locations, isLoading } = useFoodTruckLocations({ date: dateString });
  const { apiKey: mapsKey } = useGoogleMapsKey();
  
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: mapsKey || '',
  });

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEE, MMM d');
  };

  const handlePrevDay = () => setSelectedDate(prev => subDays(prev, 1));
  const handleNextDay = () => setSelectedDate(prev => addDays(prev, 1));

  // Get locations with coordinates for map
  const locationsWithCoords = useMemo(() => 
    locations?.filter(l => l.latitude && l.longitude) || [],
    [locations]
  );

  const center = useMemo(() => {
    if (locationsWithCoords.length > 0) {
      const avgLat = locationsWithCoords.reduce((sum, l) => sum + (l.latitude || 0), 0) / locationsWithCoords.length;
      const avgLng = locationsWithCoords.reduce((sum, l) => sum + (l.longitude || 0), 0) / locationsWithCoords.length;
      return { lat: avgLat, lng: avgLng };
    }
    return defaultCenter;
  }, [locationsWithCoords]);

  const onMarkerClick = useCallback((id: string) => {
    setSelectedMarker(id);
  }, []);

  return (
    <>
      <SEOHead 
        title="Food Today | ToledoLokal"
        description="Find food trucks and pop-ups in Toledo today. See where your favorite mobile vendors are serving."
      />
      <Header title="Food Today" />
      
      <PageContainer className="space-y-4">
        {/* Header */}
        <div className="text-center pt-2 pb-2">
          <h1 className="text-2xl font-bold text-foreground">Food Today</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Where the trucks are serving
          </p>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center justify-between bg-secondary/50 rounded-xl p-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handlePrevDay}
            disabled={isToday(selectedDate)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{getDateLabel(selectedDate)}</span>
            {!isToday(selectedDate) && (
              <span className="text-xs text-muted-foreground">
                {format(selectedDate, 'MMM d')}
              </span>
            )}
          </div>
          
          <Button variant="ghost" size="icon" onClick={handleNextDay}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            className="flex-1"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4 mr-2" />
            List
          </Button>
          <Button
            variant={viewMode === 'map' ? 'default' : 'outline'}
            size="sm"
            className="flex-1"
            onClick={() => setViewMode('map')}
            disabled={!mapsKey}
          >
            <MapIcon className="h-4 w-4 mr-2" />
            Map
          </Button>
        </div>

        {/* Content */}
        {viewMode === 'list' ? (
          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card-elevated overflow-hidden">
                  <Skeleton className="aspect-[16/9]" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))
            ) : locations && locations.length > 0 ? (
              locations.map(location => (
                <FoodTruckCard key={location.id} location={location} />
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                  <Utensils className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-foreground">No food trucks today</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Check back later or try another day
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={handleNextDay}
                >
                  Check Tomorrow
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="h-[60vh] rounded-xl overflow-hidden border border-border">
            {isLoaded && mapsKey ? (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={center}
                zoom={13}
                options={{
                  streetViewControl: false,
                  mapTypeControl: false,
                  fullscreenControl: false,
                }}
              >
                {locationsWithCoords.map(location => (
                  <MarkerF
                    key={location.id}
                    position={{ lat: location.latitude!, lng: location.longitude! }}
                    onClick={() => onMarkerClick(location.id)}
                    icon={{
                      url: '/placeholder.svg',
                      scaledSize: new google.maps.Size(32, 32),
                    }}
                  />
                ))}

                {selectedMarker && (() => {
                  const location = locationsWithCoords.find(l => l.id === selectedMarker);
                  if (!location) return null;
                  return (
                    <InfoWindowF
                      position={{ lat: location.latitude!, lng: location.longitude! }}
                      onCloseClick={() => setSelectedMarker(null)}
                    >
                      <div className="p-1">
                        <Link 
                          to={`/business/${location.business?.id}`}
                          className="font-medium text-foreground hover:text-primary text-sm"
                        >
                          {location.business?.name}
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {location.location_name}
                        </p>
                      </div>
                    </InfoWindowF>
                  );
                })()}
              </GoogleMap>
            ) : (
              <div className="h-full flex items-center justify-center bg-secondary">
                <p className="text-muted-foreground text-sm">Loading map...</p>
              </div>
            )}
          </div>
        )}

        {/* Note about map data */}
        {viewMode === 'map' && locationsWithCoords.length < (locations?.length || 0) && (
          <p className="text-xs text-muted-foreground text-center">
            Some locations don't have coordinates and are not shown on the map.
          </p>
        )}
      </PageContainer>
    </>
  );
}
