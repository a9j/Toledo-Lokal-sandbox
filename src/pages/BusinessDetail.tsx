import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SEOHead, createBusinessJsonLd } from '@/components/seo/SEOHead';
import { ArrowLeft } from 'lucide-react';

// New modular profile components
import { HeroCard } from '@/components/business/profile/HeroCard';
import { TrustStrip } from '@/components/business/profile/TrustStrip';
import { AboutSection } from '@/components/business/profile/AboutSection';
import { CurrentPerkCard } from '@/components/business/profile/CurrentPerkCard';
import { BusinessPulseSection } from '@/components/business/profile/BusinessPulseSection';
import { UpcomingEventsSection } from '@/components/business/profile/UpcomingEventsSection';
import { LocalImpactMeter } from '@/components/business/profile/LocalImpactMeter';
import { PhotosSection } from '@/components/business/profile/PhotosSection';
import { StickyActionDock } from '@/components/business/profile/StickyActionDock';
import { ContactCard } from '@/components/business/ContactCard';
import { BusinessMap } from '@/components/maps/BusinessMap';

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

  // Fetch active deals for Current Perk
  const { data: deals } = useQuery({
    queryKey: ['business-deals', business?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('business_id', business!.id)
        .eq('status', 'approved')
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false })
        .limit(1);
      
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
        .order('start_date_time', { ascending: true })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!business?.id,
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

  // Parse hours
  const parseHours = (hours: unknown): Record<string, { open: string; close: string; closed?: boolean } | null> | null => {
    if (!hours || typeof hours !== 'object') return null;
    return hours as Record<string, { open: string; close: string; closed?: boolean } | null>;
  };

  if (isLoading) {
    return (
      <>
        <Header title="Business" />
        <PageContainer className="space-y-4">
          <Skeleton className="h-48 rounded-3xl" />
          <Skeleton className="h-10 rounded-full w-48" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
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
  const parsedHours = parseHours(business.hours);
  const currentDeal = deals?.[0] || null;
  const currentReward = rewards?.[0] || null;

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
      
      <PageContainer className="space-y-4 pb-24">
        {/* Back button - minimal */}
        <Link 
          to="/explore" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Link>

        {/* 1. Hero Card - Above the fold */}
        <HeroCard 
          business={{
            name: business.name,
            logo_url: business.logo_url,
            category: business.category,
            neighborhood: business.neighborhood,
            photos: photos,
          }}
          isFoodTruck={business.isFoodTruck}
          isNonprofit={business.isNonprofit}
        />

        {/* 2. Trust Strip - Horizontal swipe badges */}
        <TrustStrip 
          businessId={business.id}
          isFoundingMember={business.isFoundingMember}
          isLocallyOwned={true}
          isCommunityPartner={business.isNonprofit}
          isNonprofit={business.isNonprofit}
        />

        {/* 3. Current Local Perk (deal or reward) */}
        <CurrentPerkCard 
          deal={currentDeal} 
          reward={currentReward}
        />

        {/* 4. About - max 3 short lines */}
        <AboutSection description={business.description} />

        {/* 5. Business Pulse - Recent activity */}
        <BusinessPulseSection 
          businessId={business.id}
          businessName={business.name}
        />

        {/* 6. Upcoming Events */}
        <UpcomingEventsSection events={events} />

        {/* 7. Local Impact Meter */}
        <LocalImpactMeter businessId={business.id} />

        {/* 8. Photos */}
        <PhotosSection 
          photos={photos} 
          businessName={business.name}
        />

        {/* 9. Contact & Hours */}
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

        {/* 10. Map */}
        {business.address && (
          <div className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border/50">
            <BusinessMap 
              address={business.address} 
              businessName={business.name}
              className="h-40"
            />
          </div>
        )}
      </PageContainer>

      {/* Sticky Bottom Action Dock */}
      <StickyActionDock 
        businessId={business.id}
        businessName={business.name}
        address={business.address}
        phone={business.phone}
        website={business.website}
        isNonprofit={business.isNonprofit}
      />
    </>
  );
}
