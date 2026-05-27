import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { LogoLoader } from '@/components/ui/logo-loader';
import { SEOHead, createBusinessJsonLd } from '@/components/seo/SEOHead';
import { ArrowLeft, Settings } from 'lucide-react';
import { TierBadge, TierLabel } from '@/components/business/TierBadge';
import { LocationsSection } from '@/components/business/LocationsSection';

// Flip Profile Components
import { FlipProfileContainer } from '@/components/business/profile/FlipProfileContainer';
import { 
  IdentityCard, 
  KnownForCard, 
  PulseCard, 
  ImpactCard, 
  MediaCard, 
  AboutCard 
} from '@/components/business/profile/cards';
import { StickyActionDock } from '@/components/business/profile/StickyActionDock';
import { useSavedItems } from '@/hooks/useSavedItems';
import { useBusinessSavedCount, useNeighborhoodPopularity } from '@/hooks/useDiscoverySignals';
import { SavedCountBadge } from '@/components/discovery/SavedCountBadge';
import { NeighborhoodPopularityBadge } from '@/components/discovery/NeighborhoodPopularityBadge';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { LP_ENABLED } from '@/lib/flags';
import { getVisitAction, openVisitAction } from '@/lib/visit-link';

// Public-safe columns - owner_user_id is now masked in the view for non-owners
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
  tier_status,
  tier_badge_visible,
  tier_assigned_at,
  profile_picture_url,
  cover_image_url,
  visit_link_type,
  visit_link_url,
  created_at,
  updated_at
`;

export default function BusinessDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { savedItems, toggleSave } = useSavedItems();
  const { data: savedCount = 0 } = useBusinessSavedCount(id || '');
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
        isInLoop: LP_ENABLED && data.business_loop_settings?.is_active &&
          ['community', 'growth', 'pro'].includes(data.business_loop_settings?.loop_tier_id),
        isFoundingMember: data.business_loop_settings?.is_founding_member,
        loopTierId: data.business_loop_settings?.loop_tier_id,
        tierStatus: data.tier_status,
        tierBadgeVisible: data.tier_badge_visible,
        tierAssignedAt: data.tier_assigned_at,
      };
    },
    enabled: !!id,
  });

  // Check if current user is the business owner
  const { data: isOwner } = useQuery({
    queryKey: ['business-owner-check', id, user?.id],
    queryFn: async () => {
      if (!user || !id) return false;
      const { data } = await supabase
        .from('businesses')
        .select('id')
        .eq('id', business?.id || id)
        .eq('owner_user_id', user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!id,
  });

  // Neighborhood popularity
  const { data: neighborhoodPopularity = 0 } = useNeighborhoodPopularity(business?.neighborhood_id || null);

  // Parse hours
  const parseHours = (hours: unknown): Record<string, { open: string; close: string; closed?: boolean } | null> | null => {
    if (!hours || typeof hours !== 'object') return null;
    return hours as Record<string, { open: string; close: string; closed?: boolean } | null>;
  };

  const isSaved = savedItems?.some(item => item.item_id === business?.id);

  const handleSave = () => {
    if (!user) {
      toast.error('Sign in to save businesses');
      return;
    }
    if (business) {
      toggleSave(business.id, 'business');
    }
  };

  const visitAction = business ? getVisitAction(business) : null;

  const handleVisit = () => {
    if (visitAction) openVisitAction(visitAction);
  };

  const handleSupport = () => {
    if (business?.phone) {
      window.location.href = `tel:${business.phone}`;
    } else if (business?.website) {
      window.open(business.website.startsWith('http') ? business.website : `https://${business.website}`, '_blank');
    }
  };

  if (isLoading) {
    return (
      <>
        <Header title="Business" />
        <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
          <LogoLoader size="lg" text="Loading business..." />
        </div>
      </>
    );
  }

  if (!business) {
    return (
      <>
        <Header title="Business" />
        <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Business not found</p>
            <Link to="/explore">
              <Button variant="link">Back to Explore</Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  const photos = business.photos && business.photos.length > 0 ? business.photos : [];
  const parsedHours = parseHours(business.hours);

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
      
      {/* Minimal Header with Back */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link 
            to="/explore" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
          {isOwner && (
            <Link to="/dashboard">
              <Button size="sm" variant="outline" className="gap-1.5">
                <Settings className="h-4 w-4" />
                Manage
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Flip Profile Cards */}
      <div className="pt-12 pb-20">
        <FlipProfileContainer>
          {/* Card 1: Identity / Cover */}
          <IdentityCard
            business={{
              id: business.id,
              name: business.name,
              description: business.description,
              logo_url: business.logo_url,
              category: business.category,
              neighborhood: business.neighborhood,
              photos: photos,
            }}
            isFoodTruck={business.isFoodTruck}
            isNonprofit={business.isNonprofit}
            isFoundingMember={business.isFoundingMember}
            tierStatus={business.tierStatus}
            tierBadgeVisible={business.tierBadgeVisible}
            tierAssignedAt={business.tierAssignedAt}
            isLocallyOwned={true}
            activeThisWeek={true}
            onVisit={handleVisit}
            visitLabel={visitAction?.label ?? 'Visit'}
            onSupport={handleSupport}
            onSave={handleSave}
            isSaved={isSaved}
            savedCount={savedCount}
            neighborhoodPopularity={neighborhoodPopularity}
          />

          {/* Card 2: Known For */}
          <KnownForCard
            businessName={business.name}
            category={business.category?.name}
            isNonprofit={business.isNonprofit}
          />

          {/* Card 3: Business Pulse */}
          <PulseCard
            businessId={business.id}
            businessName={business.name}
          />

          {/* Card 4: Community Impact */}
          <ImpactCard businessId={business.id} />

          {/* Card 5: Media / Photos */}
          <MediaCard
            photos={photos}
            businessName={business.name}
          />

          {/* Card 6: About / Details */}
          <AboutCard
            business={{
              description: business.description,
              address: business.address,
              phone: business.phone,
              website: business.website,
              instagram: business.instagram,
              facebook: business.facebook,
              tiktok: business.tiktok,
            }}
            hours={parsedHours}
          />
        </FlipProfileContainer>

        {/* Locations section - shows all active locations */}
        <div className="max-w-lg mx-auto px-4 mt-4">
          <LocationsSection businessId={business.id} businessName={business.name} />
        </div>
      </div>

      {/* Sticky Bottom Action Dock */}
      <StickyActionDock
        businessId={business.id}
        businessName={business.name}
        address={business.address}
        phone={business.phone}
        website={business.website}
        visitLinkType={business.visit_link_type}
        visitLinkUrl={business.visit_link_url}
        isNonprofit={business.isNonprofit}
      />
    </>
  );
}