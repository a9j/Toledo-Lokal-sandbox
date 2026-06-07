import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import {
  useFoodTruckLocations,
  useLiveFoodTrucks,
  useTruckFollows,
  useFollowTruck,
  useUnfollowTruck,
  FoodTruckLocation,
} from '@/hooks/useFoodTruckLocations';
import { FoodTruckCard } from '@/components/cards/FoodTruckCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  List,
  Map as MapIcon,
  Utensils,
  ChevronLeft,
  ChevronRight,
  Heart,
  Radio,
} from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { format, addDays, subDays, isToday, isTomorrow } from 'date-fns';
import { GoogleMap, useLoadScript, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { useGoogleMapsKey } from '@/hooks/useGoogleMapsKey';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

type ViewMode = 'list' | 'map';
type MainTab = 'live' | 'scheduled';

const mapContainerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 41.6528, lng: -83.5379 };

// Custom amber food truck marker SVG URL (constructed after Maps is loaded)
const truckMarkerUrl = (isLive: boolean) =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
      <circle cx="22" cy="22" r="20" fill="${isLive ? '#F9AB10' : '#6C7689'}" stroke="white" stroke-width="2.5"/>
      <text x="22" y="29" font-size="20" text-anchor="middle">&#x1F69A;</text>
    </svg>`
  )}`;

// ── Follow button ─────────────────────────────────────────────────────────────

function FollowButton({ businessId }: { businessId: string | undefined }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: follows } = useTruckFollows(user?.id);
  const follow = useFollowTruck();
  const unfollow = useUnfollowTruck();

  if (!businessId) return null;

  const isFollowing = follows?.has(businessId) ?? false;
  const isPending = follow.isPending || unfollow.isPending;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { navigate('/auth'); return; }
    if (isFollowing) {
      unfollow.mutate({ userId: user.id, businessId });
    } else {
      follow.mutate({ userId: user.id, businessId });
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        'flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-all',
        isFollowing
          ? 'border-lokal-amber bg-lokal-amber/10 text-lokal-amber'
          : 'border-border text-muted-foreground hover:border-lokal-amber hover:text-lokal-amber'
      )}
    >
      <Heart className={cn('h-3 w-3', isFollowing && 'fill-lokal-amber')} />
      {isFollowing ? 'Following' : 'Follow'}
    </button>
  );
}

// ── Cuisine filter chips ──────────────────────────────────────────────────────

function CuisineFilter({
  locations,
  activeCategory,
  onChange,
}: {
  locations: FoodTruckLocation[];
  activeCategory: string;
  onChange: (cat: string) => void;
}) {
  const categories = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const loc of locations) {
      const cat = loc.business?.category?.name;
      if (cat && !seen.has(cat)) { seen.add(cat); result.push(cat); }
    }
    return result;
  }, [locations]);

  if (categories.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
      <button
        onClick={() => onChange('all')}
        className={cn(
          'flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
          activeCategory === 'all'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
        )}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={cn(
            'flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
            activeCategory === cat
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

// ── Live truck card ───────────────────────────────────────────────────────────

function LiveTruckCard({ location }: { location: FoodTruckLocation }) {
  const logoSrc = location.business?.logo_url || location.business?.photos?.[0];
  return (
    <div className="card-elevated p-4 animate-fade-in-up">
      <div className="flex items-start gap-3">
        {logoSrc ? (
          <img src={logoSrc} alt={location.business?.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-lokal-amber/10 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🚚</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/business/${location.business?.id}`}
              className="font-semibold text-foreground hover:text-primary truncate"
            >
              {location.business?.name}
            </Link>
            <span className="flex items-center gap-1 text-xs font-medium text-destructive">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
              Live
            </span>
          </div>
          {location.business?.category?.name && (
            <p className="text-xs text-muted-foreground">{location.business.category.name}</p>
          )}
          <p className="text-sm text-foreground mt-1 flex items-center gap-1">
            <span>📍</span> {location.location_name}
          </p>
          {location.here_until && (
            <p className="text-xs text-lokal-amber font-medium mt-0.5">
              ⏱ Here until {format(new Date(location.here_until), 'h:mm a')}
            </p>
          )}
          {location.notes && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{location.notes}</p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <FollowButton businessId={location.business?.id} />
        <Link
          to={`/business/${location.business?.id}`}
          className="text-xs text-primary font-medium"
        >
          View business →
        </Link>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function FoodToday() {
  const queryClient = useQueryClient();
  const [mainTab, setMainTab] = useState<MainTab>('live');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [activeCategoryLive, setActiveCategoryLive] = useState('all');
  const [activeCategoryScheduled, setActiveCategoryScheduled] = useState('all');

  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const { data: scheduledLocations, isLoading: scheduledLoading } = useFoodTruckLocations({ date: dateString });
  const { data: liveLocations, isLoading: liveLoading } = useLiveFoodTrucks();
  const { apiKey: mapsKey } = useGoogleMapsKey();

  const { isLoaded } = useLoadScript({ googleMapsApiKey: mapsKey || '' });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('food-trucks-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'food_truck_locations' }, () => {
        queryClient.invalidateQueries({ queryKey: ['live-food-trucks'] });
        queryClient.invalidateQueries({ queryKey: ['food-truck-locations'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEE, MMM d');
  };

  // Client-side category filter
  const filteredLive = useMemo(() => {
    if (!liveLocations) return [];
    if (activeCategoryLive === 'all') return liveLocations;
    return liveLocations.filter((l) => l.business?.category?.name === activeCategoryLive);
  }, [liveLocations, activeCategoryLive]);

  const filteredScheduled = useMemo(() => {
    if (!scheduledLocations) return [];
    if (activeCategoryScheduled === 'all') return scheduledLocations;
    return scheduledLocations.filter((l) => l.business?.category?.name === activeCategoryScheduled);
  }, [scheduledLocations, activeCategoryScheduled]);

  const activeLocations = mainTab === 'live' ? filteredLive : filteredScheduled;
  const isLoading = mainTab === 'live' ? liveLoading : scheduledLoading;

  const locationsWithCoords = useMemo(
    () => activeLocations.filter((l) => l.latitude && l.longitude),
    [activeLocations]
  );

  const center = useMemo(() => {
    if (locationsWithCoords.length > 0) {
      const avgLat = locationsWithCoords.reduce((s, l) => s + (l.latitude || 0), 0) / locationsWithCoords.length;
      const avgLng = locationsWithCoords.reduce((s, l) => s + (l.longitude || 0), 0) / locationsWithCoords.length;
      return { lat: avgLat, lng: avgLng };
    }
    return defaultCenter;
  }, [locationsWithCoords]);

  const onMarkerClick = useCallback((id: string) => { setSelectedMarker(id); }, []);

  const liveCount = liveLocations?.length ?? 0;

  return (
    <>
      <SEOHead
        title="Food Today | ToledoLokal"
        description="Find food trucks and pop-ups in Toledo today. See where your favorite mobile vendors are serving."
      />
      <Header title="Food Today" />

      <PageContainer className="space-y-4">
        <div className="text-center pt-2 pb-2">
          <h1 className="text-2xl font-bold text-foreground">Food Today</h1>
          <p className="text-sm text-muted-foreground mt-1">Where the trucks are serving</p>
        </div>

        {/* Main tabs: Live Now / Scheduled */}
        <div className="flex gap-2 p-1 bg-muted/50 rounded-xl">
          <button
            onClick={() => setMainTab('live')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all',
              mainTab === 'live'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Radio className="h-4 w-4" />
            <span>Live Now</span>
            {liveCount > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                <span className="text-xs font-bold text-destructive">{liveCount}</span>
              </span>
            )}
          </button>
          <button
            onClick={() => setMainTab('scheduled')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all',
              mainTab === 'scheduled'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Calendar className="h-4 w-4" />
            <span>Scheduled</span>
          </button>
        </div>

        {/* Date navigation — only for Scheduled tab */}
        {mainTab === 'scheduled' && (
          <div className="flex items-center justify-between bg-secondary/50 rounded-xl p-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedDate((d) => subDays(d, 1))}
              disabled={isToday(selectedDate)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{getDateLabel(selectedDate)}</span>
              {!isToday(selectedDate) && (
                <span className="text-xs text-muted-foreground">{format(selectedDate, 'MMM d')}</span>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSelectedDate((d) => addDays(d, 1))}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Cuisine filter chips */}
        <CuisineFilter
          locations={mainTab === 'live' ? (liveLocations ?? []) : (scheduledLocations ?? [])}
          activeCategory={mainTab === 'live' ? activeCategoryLive : activeCategoryScheduled}
          onChange={mainTab === 'live' ? setActiveCategoryLive : setActiveCategoryScheduled}
        />

        {/* View toggle */}
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
                  <Skeleton className="h-36" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))
            ) : activeLocations.length > 0 ? (
              mainTab === 'live' ? (
                filteredLive.map((loc) => <LiveTruckCard key={loc.id} location={loc} />)
              ) : (
                filteredScheduled.map((loc) => <FoodTruckCard key={loc.id} location={loc} />)
              )
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                  <Utensils className="h-8 w-8 text-muted-foreground" />
                </div>
                {mainTab === 'live' ? (
                  <>
                    <h3 className="font-medium text-foreground">No trucks live right now</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Check back soon, or see Scheduled to plan ahead
                    </p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => setMainTab('scheduled')}>
                      View Scheduled
                    </Button>
                  </>
                ) : (
                  <>
                    <h3 className="font-medium text-foreground">No food trucks today</h3>
                    <p className="text-sm text-muted-foreground mt-1">Check back later or try another day</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => setSelectedDate((d) => addDays(d, 1))}
                    >
                      Check Tomorrow
                    </Button>
                  </>
                )}
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
                options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
              >
                {locationsWithCoords.map((location) => (
                  <MarkerF
                    key={location.id}
                    position={{ lat: location.latitude!, lng: location.longitude! }}
                    onClick={() => onMarkerClick(location.id)}
                    icon={{
                      url: truckMarkerUrl(location.tracking_enabled),
                      scaledSize: new google.maps.Size(44, 44),
                      anchor: new google.maps.Point(22, 22),
                    }}
                  />
                ))}

                {selectedMarker && (() => {
                  const location = locationsWithCoords.find((l) => l.id === selectedMarker);
                  if (!location) return null;
                  return (
                    <InfoWindowF
                      position={{ lat: location.latitude!, lng: location.longitude! }}
                      onCloseClick={() => setSelectedMarker(null)}
                    >
                      <div style={{ minWidth: 180 }} className="p-1">
                        <p className="font-semibold text-sm text-foreground">{location.business?.name}</p>
                        {location.business?.category?.name && (
                          <p className="text-xs text-muted-foreground">{location.business.category.name}</p>
                        )}
                        <p className="text-xs mt-1">📍 {location.location_name}</p>
                        {location.tracking_enabled && location.here_until ? (
                          <p className="text-xs font-medium mt-0.5" style={{ color: '#F9AB10' }}>
                            ⏱ Here until {format(new Date(location.here_until), 'h:mm a')}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {location.start_time.slice(0, 5)} – {location.end_time.slice(0, 5)}
                          </p>
                        )}
                        {location.notes && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{location.notes}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <FollowButton businessId={location.business?.id} />
                          <Link
                            to={`/business/${location.business?.id}`}
                            className="text-xs font-medium"
                            style={{ color: '#203D6F' }}
                          >
                            View →
                          </Link>
                        </div>
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

        {viewMode === 'map' && locationsWithCoords.length < activeLocations.length && (
          <p className="text-xs text-muted-foreground text-center">
            Some locations don't have coordinates and are not shown on the map.
          </p>
        )}
      </PageContainer>
    </>
  );
}
