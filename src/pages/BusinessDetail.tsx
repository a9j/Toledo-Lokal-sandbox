import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SecureImage } from '@/components/ui/secure-image';
import { ShareButton } from '@/components/sharing/ShareButton';
import { SEOHead, createBusinessJsonLd } from '@/components/seo/SEOHead';
import { IdentityCard } from '@/components/business/IdentityCard';
import { TodayStatusCard } from '@/components/business/TodayStatusCard';
import { LoopActionCard } from '@/components/business/LoopActionCard';
import { AboutCard } from '@/components/business/AboutCard';
import { CommunityImpactCard } from '@/components/business/CommunityImpactCard';
import { MomentsCard } from '@/components/business/MomentsCard';
import { ContactCard } from '@/components/business/ContactCard';
import { DealCard } from '@/components/cards/DealCard';
import { EventCard } from '@/components/cards/EventCard';
import { BusinessMap } from '@/components/maps/BusinessMap';
import { ArrowLeft } from 'lucide-react';

export default function BusinessDetail() {
  const { id } = useParams<{ id: string }>();

  // Public-safe columns
  const PUBLIC_BUSINESS_COLUMNS = `
    id,
    name,
    slug,
    description,
    address,
    phone,
    website,
    instagram,
    tiktok,
    facebook,
    category_id,
    neighborhood_id,
    featured,
    verified,
    average_rating,
    review_count,
    photos,
    logo_url,
    hours,
    editor_pick_image,
    story,
    status,
    created_at,
    updated_at,
    owner_user_id
  `;

  // Check if id is a UUID or a slug
  const isUUID = id ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) : false;

  const { data: business, isLoading } = useQuery({
    queryKey: ['business', id],
    queryFn: async () => {
      let query = supabase
        .from('businesses_public')
        .select(`
          ${PUBLIC_BUSINESS_COLUMNS},
          neighborhood:neighborhoods(name),
          category:categories(name, icon),
          business_loop_settings(is_active, loop_tier_id, is_founding_member)
        `);
      
      if (isUUID) {
        query = query.eq('id', id);
      } else {
        query = query.eq('slug', id);
      }
      
      const { data, error } = await query.single();
      
      if (error) throw error;
      
      // Detect if this is a food truck based on category
      const isFoodTruck = data.category?.name?.toLowerCase().includes('food truck') ||
        data.category?.icon === 'truck';
      
      // Detect if nonprofit
      const isNonprofit = data.category?.name?.toLowerCase().includes('nonprofit') ||
        data.category?.name?.toLowerCase().includes('non-profit');
      
      return {
        ...data,
        isFoodTruck,
        isNonprofit,
        isInLoop: data.business_loop_settings?.is_active && 
          data.business_loop_settings?.loop_tier_id !== 'visible_only',
        isFoundingMember: data.business_loop_settings?.is_founding_member,
        loopTierId: data.business_loop_settings?.loop_tier_id
      };
    },
    enabled: !!id,
  });

  // Fetch active deals for Today Status
  const { data: deals } = useQuery({
    queryKey: ['business-deals', business?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('business_id', business!.id)
        .eq('status', 'approved')
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!business?.id,
  });

  // Fetch upcoming events
  const { data: events } = useQuery({
    queryKey: ['business-events', business?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('business_id', business!.id)
        .eq('status', 'approved')
        .gte('start_date_time', new Date().toISOString())
        .order('start_date_time', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!business?.id,
  });

  // Fetch food truck locations for today (if food truck)
  const { data: foodTruckLocations } = useQuery({
    queryKey: ['business-food-truck-today', business?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('food_truck_locations')
        .select('*')
        .eq('business_id', business!.id)
        .eq('location_date', today)
        .eq('status', 'active')
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!business?.id && business?.isFoodTruck,
  });

  // Fetch Loop rewards for this business
  const { data: rewards } = useQuery({
    queryKey: ['business-loop-rewards-public', business?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loop_rewards')
        .select('*')
        .eq('business_id', business!.id)
        .eq('is_active', true)
        .order('points_cost', { ascending: true })
        .limit(1);
      
      if (error) throw error;
      return data;
    },
    enabled: !!business?.id && business?.isInLoop,
  });

  // Fetch Loop QR codes for points available
  const { data: qrCodes } = useQuery({
    queryKey: ['business-qr-public', business?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loop_qr_codes')
        .select('points_value')
        .eq('business_id', business!.id)
        .eq('is_active', true)
        .order('points_value', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      return data;
    },
    enabled: !!business?.id && business?.isInLoop,
  });

  // Parse hours
  const parseHours = (hours: unknown): Record<string, { open: string; close: string; closed?: boolean } | null> | null => {
    if (!hours || typeof hours !== 'object') return null;
    return hours as Record<string, { open: string; close: string; closed?: boolean } | null>;
  };

  // Determine today status - matches example spec
  const getTodayStatus = () => {
    if (!business) return null;

    const parsedHours = parseHours(business.hours);
    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[today.getDay()];
    
    const formatTime = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      const period = h >= 12 ? 'pm' : 'am';
      const h12 = h % 12 || 12;
      return `${h12}:${m > 0 ? ':' + m.toString().padStart(2, '0') : ''}${period}`;
    };

    // Food truck: Show location if here today
    if (business.isFoodTruck && foodTruckLocations && foodTruckLocations.length > 0) {
      const loc = foodTruckLocations[0];
      return {
        type: 'food_truck' as const,
        message: `Here today · ${loc.location_name} · ${formatTime(loc.start_time)}–${formatTime(loc.end_time)}`
      };
    }

    // Check for today's event (volunteer for nonprofits)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    const todaysEvent = events?.find(e => {
      const eventDate = new Date(e.start_date_time);
      return eventDate >= todayStart && eventDate <= todayEnd;
    });

    if (todaysEvent) {
      // Format event time
      const eventTime = new Date(todaysEvent.start_date_time);
      const timeStr = formatTime(`${eventTime.getHours()}:${eventTime.getMinutes().toString().padStart(2, '0')}`);
      
      // Check if this is a volunteer event (for nonprofits)
      const isVolunteer = business.isNonprofit || 
        todaysEvent.title.toLowerCase().includes('volunteer');
      
      return {
        type: isVolunteer ? 'volunteer' as const : 'event' as const,
        message: `${todaysEvent.title} · ${timeStr}`
      };
    }

    // Check for today's deal with timing
    if (deals && deals.length > 0) {
      return {
        type: 'deal' as const,
        message: deals[0].title,
        subMessage: deals[0].description?.substring(0, 50) || undefined
      };
    }
    
    // Check if open today
    if (parsedHours && parsedHours[todayName] && !parsedHours[todayName]?.closed) {
      const hours = parsedHours[todayName]!;
      return {
        type: 'open' as const,
        message: `Open today · ${formatTime(hours.open)}–${formatTime(hours.close)}`
      };
    }

    // Professional services: appointments available
    const isService = business.category?.name?.toLowerCase().includes('service') ||
      business.category?.name?.toLowerCase().includes('plumb') ||
      business.category?.name?.toLowerCase().includes('account') ||
      business.category?.name?.toLowerCase().includes('professional');
    
    if (isService) {
      return {
        type: 'appointment' as const,
        message: 'Appointments available'
      };
    }

    return null;
  };

  if (isLoading) {
    return (
      <>
        <Header title="Business" />
        <PageContainer className="space-y-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </PageContainer>
      </>
    );
  }

  if (!business) {
    return (
      <>
        <Header title="Business" />
        <PageContainer>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Business not found</p>
            <Link to="/explore">
              <Button variant="link">Back to Explore</Button>
            </Link>
          </div>
        </PageContainer>
      </>
    );
  }

  const photos = business.photos && business.photos.length > 0 ? business.photos : [];
  const hasPhotos = photos.length > 0;
  const parsedHours = parseHours(business.hours);
  const todayStatus = getTodayStatus();
  const pointsAvailable = qrCodes?.[0]?.points_value || 0;
  const rewardPreview = rewards?.[0]?.name || null;

  return (
    <>
      <SEOHead 
        title={business.name}
        description={business.description || `${business.name} - a local business in Toledo, Ohio. ${business.category?.name || ''}`}
        url={`/business/${business.slug || business.id}`}
        type="business.business"
        image={photos[0] || business.logo_url}
        keywords={[
          business.name,
          business.category?.name || '',
          business.neighborhood?.name || '',
          'Toledo business',
          'Glass City',
        ].filter(Boolean)}
        jsonLd={createBusinessJsonLd({
          name: business.name,
          description: business.description || undefined,
          address: business.address || undefined,
          phone: business.phone || undefined,
          website: business.website || undefined,
          rating: business.average_rating || undefined,
          reviewCount: business.review_count || undefined,
          image: photos[0] || business.logo_url || undefined,
          slug: business.slug || undefined,
        })}
      />
      <Header title={business.name} />
      
      <PageContainer className="space-y-4">
        {/* Back + Share */}
        <div className="flex items-center justify-between">
          <Link to="/explore" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
          <ShareButton 
            title={business.name}
            text={business.description || `Check out ${business.name} on ToledoLokal`}
          />
        </div>

        {/* Hero Photo (if exists) */}
        {hasPhotos && (
          <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-secondary">
            <SecureImage
              storagePath={photos[0]}
              alt={`${business.name} photo`}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Card 1: Identity Header */}
        <IdentityCard 
          business={{
            name: business.name,
            logo_url: business.logo_url,
            address: business.address,
            category: business.category,
            neighborhood: business.neighborhood,
            verified: business.verified,
            isInLoop: business.isInLoop,
            isFoundingMember: business.isFoundingMember,
            isNonprofit: business.isNonprofit,
            loopTierId: business.loopTierId
          }}
          isFoodTruck={business.isFoodTruck}
        />

        {/* Card 2: Today Status (Conditional) */}
        <TodayStatusCard status={todayStatus} />

        {/* Card 3: Loop Action */}
        <LoopActionCard 
          businessId={business.id}
          businessName={business.name}
          isInLoop={business.isInLoop || false}
          pointsAvailable={pointsAvailable}
          rewardPreview={rewardPreview}
          actionType={business.isNonprofit ? 'checkin' : 'scan'}
        />

        {/* Card 4: About */}
        <AboutCard description={business.description} />

        {/* Card 5: Community Impact */}
        <CommunityImpactCard />

        {/* Card 6: Moments */}
        <MomentsCard />

        {/* Contact & Hours Card */}
        <ContactCard 
          business={{
            address: business.address,
            phone: business.phone,
            website: business.website,
            instagram: business.instagram,
            tiktok: business.tiktok,
            facebook: business.facebook
          }}
          hours={parsedHours}
        />

        {/* Map */}
        {business.address && (
          <div className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border/50">
            <BusinessMap 
              address={business.address} 
              businessName={business.name}
              className="h-40"
            />
          </div>
        )}

        {/* Active Deals */}
        {deals && deals.length > 0 && (
          <section className="bg-card rounded-2xl p-5 shadow-sm border border-border/50">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Active Deals
            </h2>
            <div className="space-y-2">
              {deals.map(deal => (
                <DealCard key={deal.id} deal={{ ...deal, business }} />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Events */}
        {events && events.length > 0 && (
          <section className="bg-card rounded-2xl p-5 shadow-sm border border-border/50">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Upcoming Events
            </h2>
            <div className="space-y-2">
              {events.map(event => (
                <EventCard key={event.id} event={{ ...event, business }} compact />
              ))}
            </div>
          </section>
        )}
      </PageContainer>
    </>
  );
}
