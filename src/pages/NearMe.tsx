import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { SEOHead } from '@/components/seo/SEOHead';
import { SecureImage } from '@/components/ui/secure-image';
import { Skeleton } from '@/components/ui/skeleton';
import { useGoogleMapsKey } from '@/hooks/useGoogleMapsKey';
import { GoogleMap, Marker, InfoWindow, Circle } from '@react-google-maps/api';
import { MapCanvas } from '@/components/maps/MapCanvas';
import { 
  MapPin, 
  List, 
  Map as MapIcon, 
  Store, 
  Truck,
  Gift,
  QrCode,
  ExternalLink,
  Navigation
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { haversineMiles } from '@/lib/geo';
import { format } from 'date-fns';

interface NearbyBusiness {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  address: string | null;
  category: { name: string; icon: string } | null;
  neighborhood: { name: string } | null;
  has_active_deal: boolean;
  has_loop_rewards: boolean;
  is_food_truck_today: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

// One marker per active location. Multiple pins can share a businessId (a brand
// with several locations); all link back to the same brand profile.
interface MapPin {
  pinId: string;
  businessId: string;
  name: string;
  slug: string | null;
  category: { name: string; icon: string } | null;
  has_active_deal: boolean;
  has_loop_rewards: boolean;
  is_food_truck_today: boolean;
  address: string;
  lat: number | null;
  lng: number | null;
}

interface LocationRow {
  id: string;
  business_id: string;
  street_address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  neighborhood: string | null;
  latitude: number | null;
  longitude: number | null;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const toledoCenter = {
  lat: 41.6528,
  lng: -83.5379,
};

// "Near me" proximity radius. Businesses farther than this from the visitor's
// location are hidden once location sharing is granted. Tune here.
const NEAR_ME_RADIUS_MILES = 5;

export default function NearMe() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'open' | 'rewards' | 'deals'>('all');
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);
  const [geocodedLocations, setGeocodedLocations] = useState<Map<string, { lat: number; lng: number }>>(new Map());
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'prompting' | 'granted' | 'denied' | 'unavailable' | 'timeout' | 'unsupported' | 'insecure'>('idle');
  const [geoMessage, setGeoMessage] = useState<string | null>(null);
  const { apiKey: mapsApiKey, isLoading: mapsLoading, error: mapsError } = useGoogleMapsKey();

  // Ask for the visitor's location so we can limit results to nearby places.
  const requestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGeoStatus('unsupported');
      setGeoMessage("Your browser doesn't support location sharing.");
      return;
    }
    // Browsers only expose geolocation over HTTPS (or localhost). On an
    // insecure origin getCurrentPosition silently never resolves, so bail early
    // with a clear message instead of spinning forever.
    if (!window.isSecureContext) {
      setGeoStatus('insecure');
      setGeoMessage('Location needs a secure (https) connection to work.');
      return;
    }

    setGeoStatus('prompting');
    setGeoMessage(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus('granted');
        setGeoMessage(null);
      },
      (err) => {
        // Surface the real reason instead of failing silently. err.code:
        // 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT.
        console.warn(`Geolocation error (code ${err.code}): ${err.message}`);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGeoStatus('denied');
            setGeoMessage(
              window.self !== window.top
                ? 'Location is blocked while the app is embedded. Open ToledoLokal in its own browser tab, then try again.'
                : 'Location is blocked. Enable it for this site in your browser settings, then try again.'
            );
            break;
          case err.POSITION_UNAVAILABLE:
            setGeoStatus('unavailable');
            setGeoMessage("We couldn't determine your location right now. Check your device's location services and try again.");
            break;
          case err.TIMEOUT:
            setGeoStatus('timeout');
            setGeoMessage('Finding your location took too long. Try again.');
            break;
          default:
            setGeoStatus('unavailable');
            setGeoMessage("We couldn't get your location. Try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);
  
  const today = format(new Date(), 'yyyy-MM-dd');

  // Fetch businesses with today's relevance
  const { data: businesses, isLoading } = useQuery({
    queryKey: ['near-me-businesses', today],
    queryFn: async (): Promise<NearbyBusiness[]> => {
      // Get businesses
      const { data: bizData, error: bizError } = await supabase
        .from('businesses_public')
        .select(`
          id, name, slug, logo_url, address,
          category:categories(name, icon),
          neighborhood:neighborhoods(name),
          business_loop_settings(is_active)
        `)
        // Only surface approved businesses on the public map/list.
        .eq('status', 'approved')
        .order('featured', { ascending: false })
        .limit(50);

      if (bizError) throw bizError;

      // Get active deals
      const { data: dealsData } = await supabase
        .from('deals')
        .select('business_id')
        .eq('status', 'approved')
        .gte('end_date', today);
      
      const businessesWithDeals = new Set(dealsData?.map(d => d.business_id) || []);

      // Get today's food truck locations
      const { data: foodTrucks } = await supabase
        .from('food_truck_locations')
        .select('business_id')
        .eq('location_date', today)
        .eq('status', 'active');
      
      const foodTruckBusinesses = new Set(foodTrucks?.map(ft => ft.business_id) || []);

      return (bizData || []).map(biz => ({
        id: biz.id,
        name: biz.name,
        slug: biz.slug,
        logo_url: biz.logo_url,
        address: biz.address,
        category: biz.category,
        neighborhood: biz.neighborhood,
        has_active_deal: businessesWithDeals.has(biz.id),
        has_loop_rewards: biz.business_loop_settings?.is_active || false,
        is_food_truck_today: foodTruckBusinesses.has(biz.id),
      }));
    },
    staleTime: 1000 * 60 * 5,
  });

  // Active locations of approved businesses (RLS restricts to approved parents).
  // Drives one map pin per location.
  const { data: locationRows } = useQuery({
    queryKey: ['near-me-locations'],
    queryFn: async (): Promise<LocationRow[]> => {
      const { data, error } = await supabase
        .from('business_locations')
        .select('id, business_id, street_address, city, state, zip_code, neighborhood, latitude, longitude')
        .eq('is_active', true);
      if (error) throw error;
      return (data || []) as LocationRow[];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Nearest known distance (miles) from the visitor to each business, using
  // stored location coords plus any addresses geocoded for the map. Businesses
  // with no resolvable coordinates simply won't appear here.
  const businessDistances = useMemo(() => {
    if (!userLocation || !businesses) return null;
    const result = new Map<string, number>();

    const consider = (businessId: string, lat: number, lng: number) => {
      const d = haversineMiles(userLocation, { lat, lng });
      const prev = result.get(businessId);
      if (prev === undefined || d < prev) result.set(businessId, d);
    };

    (locationRows ?? []).forEach((loc) => {
      if (loc.latitude == null || loc.longitude == null) return;
      consider(loc.business_id, Number(loc.latitude), Number(loc.longitude));
    });

    geocodedLocations.forEach((coord, pinId) => {
      let businessId: string | undefined;
      if (pinId.startsWith('biz-')) businessId = pinId.slice(4);
      else if (pinId.startsWith('loc-')) {
        businessId = (locationRows ?? []).find((l) => l.id === pinId.slice(4))?.business_id;
      }
      if (businessId) consider(businessId, coord.lat, coord.lng);
    });

    return result;
  }, [userLocation, businesses, locationRows, geocodedLocations]);

  // A business is "near" if it has at least one location within the radius.
  // When location isn't shared, or a business's coords are unknown, we don't
  // hide it (graceful fallback rather than an empty page).
  const isWithinRadius = useCallback(
    (businessId: string) => {
      if (!userLocation || !businessDistances) return true;
      const d = businessDistances.get(businessId);
      if (d === undefined) return true;
      return d <= NEAR_ME_RADIUS_MILES;
    },
    [userLocation, businessDistances]
  );

  const radiusBusinesses = useMemo(
    () => (businesses ?? []).filter((biz) => isWithinRadius(biz.id)),
    [businesses, isWithinRadius]
  );

  // Filter businesses
  const filteredBusinesses = useMemo(() => {
    return radiusBusinesses.filter(biz => {
      switch (selectedFilter) {
        case 'rewards':
          return biz.has_loop_rewards;
        case 'deals':
          return biz.has_active_deal;
        default:
          return true;
      }
    });
  }, [radiusBusinesses, selectedFilter]);

  // One pin per active location. Brands without any location row fall back to
  // the address stored on the business. Virtual (online-only) locations get no
  // pin. Coordinates come from the stored lat/lng when present, otherwise the
  // map geocodes the address client-side on load.
  const mapPins = useMemo<MapPin[]>(() => {
    const bizById = new Map(filteredBusinesses.map((b) => [b.id, b]));
    const pins: MapPin[] = [];
    const businessesWithLocation = new Set<string>();

    (locationRows ?? []).forEach((loc) => {
      const biz = bizById.get(loc.business_id);
      if (!biz) return;
      businessesWithLocation.add(loc.business_id);
      if (loc.neighborhood === 'Virtual' || !loc.street_address?.trim()) return;

      const address = `${loc.street_address}, ${loc.city ?? 'Toledo'}, ${loc.state ?? 'OH'} ${loc.zip_code ?? ''}`.trim();
      pins.push({
        pinId: `loc-${loc.id}`,
        businessId: biz.id,
        name: biz.name,
        slug: biz.slug,
        category: biz.category,
        has_active_deal: biz.has_active_deal,
        has_loop_rewards: biz.has_loop_rewards,
        is_food_truck_today: biz.is_food_truck_today,
        address,
        lat: loc.latitude != null ? Number(loc.latitude) : null,
        lng: loc.longitude != null ? Number(loc.longitude) : null,
      });
    });

    // Fallback for brands that have no location rows but do have an address.
    filteredBusinesses.forEach((biz) => {
      if (businessesWithLocation.has(biz.id) || !biz.address?.trim()) return;
      pins.push({
        pinId: `biz-${biz.id}`,
        businessId: biz.id,
        name: biz.name,
        slug: biz.slug,
        category: biz.category,
        has_active_deal: biz.has_active_deal,
        has_loop_rewards: biz.has_loop_rewards,
        is_food_truck_today: biz.is_food_truck_today,
        address: `${biz.address}, Toledo, OH`,
        lat: null,
        lng: null,
      });
    });

    return pins;
  }, [locationRows, filteredBusinesses]);

  const coordsFor = useCallback(
    (pin: MapPin): { lat: number; lng: number } | null => {
      if (pin.lat != null && pin.lng != null) return { lat: pin.lat, lng: pin.lng };
      return geocodedLocations.get(pin.pinId) ?? null;
    },
    [geocodedLocations]
  );

  // Stats
  const stats = useMemo(() => {
    return {
      total: radiusBusinesses.length,
      withRewards: radiusBusinesses.filter(b => b.has_loop_rewards).length,
      withDeals: radiusBusinesses.filter(b => b.has_active_deal).length,
      foodTrucks: radiusBusinesses.filter(b => b.is_food_truck_today).length,
    };
  }, [radiusBusinesses]);

  // Geocode any pins without stored coordinates when the map is visible.
  const onMapLoad = useCallback(() => {
    if (!mapPins.length) return;

    const geocoder = new google.maps.Geocoder();

    mapPins.forEach((pin) => {
      if ((pin.lat != null && pin.lng != null) || geocodedLocations.has(pin.pinId)) return;

      geocoder.geocode({ address: pin.address }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          setGeocodedLocations((prev) => {
            const updated = new Map(prev);
            updated.set(pin.pinId, { lat: location.lat(), lng: location.lng() });
            return updated;
          });
        }
      });
    });
  }, [mapPins, geocodedLocations]);

  // Center on the visitor when shared, otherwise the average of resolved pins.
  const mapCenter = useMemo(() => {
    if (userLocation) return userLocation;
    const coords = mapPins
      .map((pin) =>
        pin.lat != null && pin.lng != null
          ? { lat: pin.lat, lng: pin.lng }
          : geocodedLocations.get(pin.pinId)
      )
      .filter((c): c is { lat: number; lng: number } => !!c);

    if (coords.length === 0) return toledoCenter;
    const avgLat = coords.reduce((sum, c) => sum + c.lat, 0) / coords.length;
    const avgLng = coords.reduce((sum, c) => sum + c.lng, 0) / coords.length;
    return { lat: avgLat, lng: avgLng };
  }, [userLocation, mapPins, geocodedLocations]);

  return (
    <>
      <SEOHead
        title="Near Me | ToledoLokal"
        description="Find open businesses, food trucks, and deals near you in Toledo"
        url="/near-me"
      />
      <Header title="Near Me" />

      <div className="min-h-screen bg-background pb-24">
        {/* Filters & View Toggle */}
        <div className="px-4 py-3 border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-10">
          <div className="flex items-center justify-between mb-3">
            {/* View Toggle */}
            <div className="flex gap-1 p-1 bg-muted rounded-xl">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  viewMode === 'list' 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground"
                )}
              >
                <List className="h-4 w-4" />
                List
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  viewMode === 'map' 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground"
                )}
              >
                <MapIcon className="h-4 w-4" />
                Map
              </button>
            </div>

            {/* Stats */}
            <div className="text-xs text-muted-foreground">
              {filteredBusinesses.length} places
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
            <FilterPill
              active={selectedFilter === 'all'}
              onClick={() => setSelectedFilter('all')}
              icon={<Store className="h-3.5 w-3.5" />}
              label="All"
              count={stats.total}
            />
            <FilterPill
              active={selectedFilter === 'rewards'}
              onClick={() => setSelectedFilter('rewards')}
              icon={<QrCode className="h-3.5 w-3.5" />}
              label="Loop Rewards"
              count={stats.withRewards}
              accentColor="text-primary bg-primary/10 border-primary/30"
            />
            <FilterPill
              active={selectedFilter === 'deals'}
              onClick={() => setSelectedFilter('deals')}
              icon={<Gift className="h-3.5 w-3.5" />}
              label="Deals"
              count={stats.withDeals}
              accentColor="text-toledo-rose bg-toledo-rose/10 border-toledo-rose/30"
            />
          </div>

          {/* Location status */}
          {geoStatus !== 'idle' && (
            <div className="mt-2 text-xs">
              {geoStatus === 'granted' && userLocation ? (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Navigation className="h-3 w-3 text-primary" />
                  Within {NEAR_ME_RADIUS_MILES} miles of you
                </span>
              ) : geoStatus === 'prompting' ? (
                <span className="text-muted-foreground">Finding places near you…</span>
              ) : (
                <span className="inline-flex flex-wrap items-center gap-2 text-muted-foreground">
                  <span>{geoMessage ? geoMessage : 'Showing all of Toledo.'}</span>
                  {(geoStatus === 'denied' || geoStatus === 'unavailable' || geoStatus === 'timeout') && (
                    <button
                      onClick={requestLocation}
                      className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                    >
                      <Navigation className="h-3 w-3" /> Use my location
                    </button>
                  )}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className={cn("px-4 py-4", viewMode === 'map' && "p-0 h-[calc(100vh-180px)]")}>
          {isLoading ? (
            <div className="space-y-3 px-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : viewMode === 'list' ? (
            <div className="space-y-3">
              {filteredBusinesses.map(business => (
                <NearbyBusinessCard key={business.id} business={business} />
              ))}
              
              {filteredBusinesses.length === 0 && (
                <div className="text-center py-12">
                  <MapPin className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No places found with this filter</p>
                </div>
              )}
            </div>
          ) : mapsLoading ? (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <div className="text-center">
                <Skeleton className="h-8 w-8 rounded-full mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading map...</p>
              </div>
            </div>
          ) : mapsError || !mapsApiKey ? (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <div className="text-center p-6">
                <MapIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground mb-2">Map unavailable</p>
                <p className="text-xs text-muted-foreground">Please sign in to view the map</p>
              </div>
            </div>
          ) : (
            <MapCanvas
              apiKey={mapsApiKey}
              loadingFallback={
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <div className="text-center">
                    <Skeleton className="h-8 w-8 rounded-full mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading map...</p>
                  </div>
                </div>
              }
              errorFallback={
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <div className="text-center p-6">
                    <MapIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground mb-2">Map unavailable</p>
                    <p className="text-xs text-muted-foreground">
                      We couldn't load the map right now. Try the list view.
                    </p>
                  </div>
                </div>
              }
            >
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={userLocation ? 13 : 12}
                onLoad={onMapLoad}
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
                {userLocation && (
                  <>
                    <Circle
                      center={userLocation}
                      radius={NEAR_ME_RADIUS_MILES * 1609.34}
                      options={{
                        strokeColor: '#3B82F6',
                        strokeOpacity: 0.4,
                        strokeWeight: 1,
                        fillColor: '#3B82F6',
                        fillOpacity: 0.06,
                        clickable: false,
                      }}
                    />
                    <Marker
                      position={userLocation}
                      title="You are here"
                      zIndex={999}
                      icon={{
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 7,
                        fillColor: '#2563EB',
                        fillOpacity: 1,
                        strokeColor: '#ffffff',
                        strokeWeight: 3,
                      }}
                    />
                  </>
                )}

                {mapPins.map((pin) => {
                  const coords = coordsFor(pin);
                  if (!coords) return null;

                  return (
                    <Marker
                      key={pin.pinId}
                      position={coords}
                      title={pin.name}
                      onClick={() => setSelectedPin(pin)}
                      icon={{
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 10,
                        fillColor: pin.is_food_truck_today ? '#F59E0B' : pin.has_loop_rewards ? '#8B5CF6' : '#3B82F6',
                        fillOpacity: 1,
                        strokeColor: '#ffffff',
                        strokeWeight: 2,
                      }}
                    />
                  );
                })}

                {selectedPin && coordsFor(selectedPin) && (
                  <InfoWindow
                    position={coordsFor(selectedPin)!}
                    onCloseClick={() => setSelectedPin(null)}
                  >
                    <div className="p-2 min-w-[200px]">
                      <h3 className="font-semibold text-sm mb-1">{selectedPin.name}</h3>
                      {selectedPin.category && (
                        <p className="text-xs text-gray-600 mb-1">{selectedPin.category.name}</p>
                      )}
                      <div className="flex gap-1 mb-2">
                        {selectedPin.has_loop_rewards && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px]">
                            <QrCode className="h-2.5 w-2.5" /> Rewards
                          </span>
                        )}
                        {selectedPin.has_active_deal && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px]">
                            <Gift className="h-2.5 w-2.5" /> Deal
                          </span>
                        )}
                        {selectedPin.is_food_truck_today && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px]">
                            <Truck className="h-2.5 w-2.5" /> Today
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => navigate(selectedPin.slug ? `/business/${selectedPin.slug}` : `/business/${selectedPin.businessId}`)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                      >
                        View Profile <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            </MapCanvas>
          )}
        </div>
      </div>
    </>
  );
}

interface FilterPillProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
  accentColor?: string;
}

function FilterPill({ active, onClick, icon, label, count, accentColor }: FilterPillProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm font-medium whitespace-nowrap transition-all",
        active 
          ? accentColor || "bg-foreground text-background border-foreground"
          : "border-border hover:bg-muted"
      )}
    >
      {icon}
      {label}
      {count !== undefined && (
        <span className={cn(
          "text-xs px-1.5 py-0.5 rounded-full",
          active ? "bg-background/20" : "bg-muted"
        )}>
          {count}
        </span>
      )}
    </button>
  );
}

interface NearbyBusinessCardProps {
  business: NearbyBusiness;
}

function NearbyBusinessCard({ business }: NearbyBusinessCardProps) {
  const href = business.slug ? `/business/${business.slug}` : `/business/${business.id}`;

  return (
    <Link 
      to={href}
      className="card-elevated flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
    >
      {/* Logo */}
      <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted flex-shrink-0">
        {business.logo_url ? (
          <SecureImage
            storagePath={business.logo_url}
            alt={business.name}
            className="w-full h-full object-cover"
            fallback={
              <div className="w-full h-full flex items-center justify-center bg-primary/10">
                <Store className="h-6 w-6 text-primary" />
              </div>
            }
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/10">
            <Store className="h-6 w-6 text-primary" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <h3 className="font-semibold text-foreground truncate">
            {business.name}
          </h3>
          {business.is_food_truck_today && (
            <span className="flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-lokal-amber/10 text-lokal-amber text-[10px] font-semibold">
              <Truck className="h-2.5 w-2.5" />
              TODAY
            </span>
          )}
        </div>
        
        {business.category && (
          <p className="text-sm text-muted-foreground">{business.category.name}</p>
        )}
        
        {business.neighborhood && (
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {business.neighborhood.name}
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-col gap-1 flex-shrink-0">
        {business.has_loop_rewards && (
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <QrCode className="h-4 w-4 text-primary" />
          </span>
        )}
        {business.has_active_deal && (
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-toledo-rose/10">
            <Gift className="h-4 w-4 text-toledo-rose" />
          </span>
        )}
      </div>
    </Link>
  );
}
