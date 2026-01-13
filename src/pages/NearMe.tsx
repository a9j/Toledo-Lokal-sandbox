import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { SEOHead } from '@/components/seo/SEOHead';
import { SecureImage } from '@/components/ui/secure-image';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useGoogleMapsKey } from '@/hooks/useGoogleMapsKey';
import { 
  MapPin, 
  List, 
  Map as MapIcon, 
  Clock, 
  Store, 
  Truck,
  Gift,
  QrCode,
  Navigation,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
}

export default function NearMe() {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'open' | 'rewards' | 'deals'>('all');
  const { apiKey: mapsApiKey } = useGoogleMapsKey();
  
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

  // Filter businesses
  const filteredBusinesses = useMemo(() => {
    if (!businesses) return [];
    
    return businesses.filter(biz => {
      switch (selectedFilter) {
        case 'rewards':
          return biz.has_loop_rewards;
        case 'deals':
          return biz.has_active_deal;
        default:
          return true;
      }
    });
  }, [businesses, selectedFilter]);

  // Stats
  const stats = useMemo(() => {
    if (!businesses) return { total: 0, withRewards: 0, withDeals: 0, foodTrucks: 0 };
    return {
      total: businesses.length,
      withRewards: businesses.filter(b => b.has_loop_rewards).length,
      withDeals: businesses.filter(b => b.has_active_deal).length,
      foodTrucks: businesses.filter(b => b.is_food_truck_today).length,
    };
  }, [businesses]);

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
        </div>

        {/* Content */}
        <div className="px-4 py-4">
          {isLoading ? (
            <div className="space-y-3">
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
          ) : (
            <div className="text-center py-12 card-elevated rounded-xl">
              <MapIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground mb-2">Map view coming soon</p>
              <p className="text-xs text-muted-foreground">Switch to list view to browse</p>
            </div>
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
