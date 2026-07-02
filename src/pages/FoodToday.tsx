import { useState, useMemo, useCallback, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { useFoodTruckLocations, useFoodTrucks } from '@/hooks/useFoodTruckLocations';
import { FoodTruckCard } from '@/components/cards/FoodTruckCard';
import { BusinessCard } from '@/components/cards/BusinessCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, List, Map as MapIcon, Utensils, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { format, parse, addDays, subDays, isToday, isTomorrow } from 'date-fns';
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

const formatTime12hr = (time: string): string => {
  if (!time) return '';
  try {
    return format(parse(time, 'HH:mm:ss', new Date()), 'h:mm a');
  } catch {
    return time;
  }
};

export default function FoodToday() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { apiKey: mapsKey, isLoading: mapsKeyLoading } = useGoogleMapsKey();
  const [viewMode, setViewMode] = useState<ViewMode>(mapsKey ? 'map' : 'list');
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);

  useEffect(() => {
    if (!mapsKeyLoading && !mapsKey && viewMode === 'map') {
      setViewMode('list');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- viewMode is read but not a trigger; we only want to run this when the maps key loading state resolves, not when the user manually switches view modes
  }, [mapsKeyLoading, mapsKey]);

  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const { data: locations, isLoading } = useFoodTruckLocations({ date: dateString });
  const { data: allTrucks } = useFoodTrucks();

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: mapsKey || 'MISSING',
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
        title="Food Trucks | ToledoLokal"
        description="Find food trucks and pop-ups in Toledo on a live map. See where your favorite mobile vendors are serving today."
      />
      <Header title="Food Trucks" showBack />

      <PageContainer className="space-y-4">
        {/* Header */}
        <div className="text-center pt-2 pb-2">
          <h1 className="text-2xl font-bold text-foreground">Food Trucks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Find where the trucks are serving on the map
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
            variant={viewMode === 'map' ? 'default' : 'outline'}
            size="sm"
            className="flex-1"
            onClick={() => setViewMode('map')}
          >
            <MapIcon className="h-4 w-4 mr-2" />
            Map
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            className="flex-1"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4 mr-2" />
            List
          </Button>
        </div>

        {/* Content. In map mode the map ALWAYS renders (centered on Toledo) so
            the page never collapses to a blank empty state — even before any
            truck has posted a stop. The "no stops" message becomes an overlay
            on top of the map instead of replacing it. */}
        {viewMode === 'map' ? (
          <div className="relative h-[60vh] rounded-xl overflow-hidden border border-border">
            {mapsKeyLoading ? (
              <div className="h-full flex items-center justify-center bg-secondary">
                <p className="text-muted-foreground text-sm">Loading map…</p>
              </div>
            ) : !mapsKey ? (
              <div className="h-full flex flex-col items-center justify-center bg-secondary text-center p-6">
                <MapIcon className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground text-sm mb-1">Map unavailable</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Sign in to view the live food truck map.
                </p>
                <Button variant="outline" size="sm" onClick={() => setViewMode('list')}>
                  <List className="h-4 w-4 mr-2" />
                  View as list
                </Button>
              </div>
            ) : !isLoaded ? (
              <div className="h-full flex items-center justify-center bg-secondary">
                <p className="text-muted-foreground text-sm">Loading map…</p>
              </div>
            ) : (
              <>
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
                      title={location.business?.name}
                      onClick={() => onMarkerClick(location.id)}
                      icon={{
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 10,
                        fillColor: '#F59E0B',
                        fillOpacity: 1,
                        strokeColor: '#ffffff',
                        strokeWeight: 2,
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
                        <div className="p-1 min-w-[160px]">
                          <Link
                            to={location.business ? `/business/${location.business.id}` : '#'}
                            className="font-medium text-foreground hover:text-primary text-sm"
                          >
                            {location.business?.name || 'Food Vendor'}
                          </Link>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {location.location_name}
                          </p>
                          <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            {formatTime12hr(location.start_time)} – {formatTime12hr(location.end_time)}
                          </p>
                        </div>
                      </InfoWindowF>
                    );
                  })()}
                </GoogleMap>

                {/* No-stops overlay — keeps the Toledo map visible while telling
                    the user nothing is posted for the selected day. */}
                {!isLoading && locationsWithCoords.length === 0 && (
                  <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center p-3">
                    <div className="pointer-events-auto max-w-xs rounded-xl bg-background/95 backdrop-blur border border-border shadow-sm px-4 py-3 text-center">
                      <p className="text-sm font-medium text-foreground">
                        No truck stops posted for {getDateLabel(selectedDate).toLowerCase()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Pins appear here when a truck shares where it's parked. Browse all Toledo trucks below.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card-elevated overflow-hidden">
                <Skeleton className="aspect-[16/9]" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : !locations || locations.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <Utensils className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground">No trucks scheduled today</h3>
            <p className="text-sm text-muted-foreground mt-1">
              No truck has posted a stop for this day yet — browse all Toledo trucks below.
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
        ) : (
          <div className="space-y-4">
            {locations.map(location => (
              <FoodTruckCard key={location.id} location={location} />
            ))}
          </div>
        )}

        {/* Note about map data */}
        {viewMode === 'map' && mapsKey && locationsWithCoords.length < (locations?.length || 0) && (
          <p className="text-xs text-muted-foreground text-center">
            Some trucks haven't shared a map pin yet — switch to List to see them all.
          </p>
        )}

        {/* Directory: every signed-up truck, so they're discoverable even before
            they post a stop for the day. */}
        {allTrucks && allTrucks.length > 0 && (
          <section className="space-y-3 pt-4 border-t border-border/50">
            <div>
              <h2 className="text-sm font-semibold text-foreground tracking-tight">All Toledo Food Trucks</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tap a truck to see its profile, menu, and how to follow it.
              </p>
            </div>
            <div className="space-y-3">
              {allTrucks.map(truck => (
                <BusinessCard key={truck.id} business={truck} />
              ))}
            </div>
          </section>
        )}
      </PageContainer>
    </>
  );
}
