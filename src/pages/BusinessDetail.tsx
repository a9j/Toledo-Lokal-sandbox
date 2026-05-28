import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { LogoLoader } from '@/components/ui/logo-loader';
import { SEOHead, createBusinessJsonLd } from '@/components/seo/SEOHead';
import { useSavedItems } from '@/hooks/useSavedItems';
import { useBusinessSavedCount } from '@/hooks/useDiscoverySignals';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { LP_ENABLED } from '@/lib/flags';
import { isBusinessCategory, parseModuleContent } from '@/lib/profile-modules';
import {
  BUSINESS_TYPE_CONFIG,
  resolveAction,
  resolveActions,
  ProfileActionContext,
  ProfileTab,
} from '@/lib/business-profile-config';
import { ProfileBusiness } from '@/components/business/profile/redesign/profile-types';
import { ProfileHero } from '@/components/business/profile/redesign/ProfileHero';
import { ProfileTabs } from '@/components/business/profile/redesign/ProfileTabs';
import { TodayTab } from '@/components/business/profile/redesign/TodayTab';
import { PulseTab } from '@/components/business/profile/redesign/PulseTab';
import { RewardsTab } from '@/components/business/profile/redesign/RewardsTab';
import { CommunityTab } from '@/components/business/profile/redesign/CommunityTab';
import { PhotosTab } from '@/components/business/profile/redesign/PhotosTab';
import { AboutTab } from '@/components/business/profile/redesign/AboutTab';

// Public-safe columns - owner_user_id is masked in the view for non-owners
const PUBLIC_BUSINESS_COLUMNS = `
  id, name, slug, description, address, phone, website, instagram, tiktok, facebook,
  category_id, neighborhood_id, featured, verified, average_rating, review_count,
  photos, logo_url, hours, editor_pick_image, story, status,
  tier_status, tier_badge_visible, tier_assigned_at,
  profile_picture_url, cover_image_url, owner_user_id, created_at, updated_at
`;

// visit_link_*, category enum and profile_modules ship via recent migrations.
// Selected separately so the page still loads if a migration hasn't reached the view.
const NEW_COLUMNS = 'visit_link_type, visit_link_url, business_category:category, profile_modules';

export default function BusinessDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { savedItems, toggleSave } = useSavedItems();
  const { data: savedCount = 0 } = useBusinessSavedCount(id || '');
  const [tab, setTab] = useState<ProfileTab>('today');
  const isUUID = id ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) : false;

  const { data: business, isLoading } = useQuery({
    queryKey: ['business', id],
    queryFn: async () => {
      // The categories relation already uses the "category" alias, so the scalar
      // enum column is aliased to business_category to avoid a name clash.
      const primary = supabase
        .from('businesses_public')
        .select(`
          ${PUBLIC_BUSINESS_COLUMNS},
          ${NEW_COLUMNS},
          neighborhood:neighborhoods(name),
          category:categories(name, icon),
          business_loop_settings(is_active, loop_tier_id, is_founding_member)
        `);
      let { data, error } = await (isUUID ? primary.eq('id', id) : primary.eq('slug', id)).single();

      // On any error (e.g. a pending migration), retry with base columns.
      if (error) {
        const fallbackSelect: string = `
          ${PUBLIC_BUSINESS_COLUMNS},
          neighborhood:neighborhoods(name),
          category:categories(name, icon),
          business_loop_settings(is_active, loop_tier_id, is_founding_member)
        `;
        const fb = supabase.from('businesses_public').select(fallbackSelect);
        const res = await (isUUID ? fb.eq('id', id) : fb.eq('slug', id)).single();
        data = res.data as unknown as typeof data;
        error = res.error;
      }

      if (error) throw error;

      const isFoodTruck = data.category?.name?.toLowerCase().includes('food truck') || data.category?.icon === 'truck';
      const isNonprofit = data.category?.name?.toLowerCase().includes('nonprofit') ||
        data.category?.name?.toLowerCase().includes('non-profit');

      return {
        ...data,
        isFoodTruck,
        isNonprofit,
        isInLoop: LP_ENABLED && data.business_loop_settings?.is_active &&
          ['community', 'growth', 'pro'].includes(data.business_loop_settings?.loop_tier_id),
        isFoundingMember: data.business_loop_settings?.is_founding_member,
        tierStatus: data.tier_status,
        tierBadgeVisible: data.tier_badge_visible,
        tierAssignedAt: data.tier_assigned_at,
        profileCategory: isBusinessCategory(data.business_category) ? data.business_category : 'restaurant',
        moduleContent: parseModuleContent(data.profile_modules),
      };
    },
    enabled: !!id,
  });

  const { data: isOwner = false } = useQuery({
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

  const isSaved = !!savedItems?.some((item) => item.item_id === business?.id);

  const handleSave = () => {
    if (!user) {
      toast.error('Sign in to save businesses');
      return;
    }
    if (business) toggleSave(business.id, 'business');
  };

  const handleShare = async () => {
    const url = window.location.href;
    const name = business?.name ?? 'this business';
    if (navigator.share) {
      try { await navigator.share({ title: name, text: `Check out ${name} on ToledoLokal`, url }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LogoLoader size="lg" text="Loading business..." />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="py-12 text-center">
          <p className="mb-4 text-muted-foreground">Business not found</p>
          <Link to="/explore"><Button variant="link">Back to Explore</Button></Link>
        </div>
      </div>
    );
  }

  const pb = business as unknown as ProfileBusiness;
  const photos = business.photos?.length ? business.photos : [];
  const config = BUSINESS_TYPE_CONFIG[pb.profileCategory];

  const actionCtx: ProfileActionContext = { onSave: handleSave, onShare: handleShare, isSaved, setTab };
  const primaryAction = resolveAction(config.primaryAction, pb, pb.moduleContent, actionCtx);
  const contactActions = resolveActions(
    [config.primaryAction, config.secondaryAction, 'call', 'directions'],
    pb, pb.moduleContent, actionCtx
  );
  const liveStatus = config.liveStatus[0] ?? '';

  return (
    <>
      <SEOHead
        title={business.name}
        description={business.description || `${business.name} - a local business in Toledo, Ohio. ${business.category?.name || ''}`}
        url={`/business/${business.slug || business.id}`}
        type="business.business"
        image={photos[0] || business.logo_url}
        keywords={[business.name, business.category?.name || '', business.neighborhood?.name || '', 'Toledo business', 'Glass City'].filter(Boolean)}
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

      <div className="mx-auto min-h-screen max-w-lg bg-background pb-24">
        <ProfileHero
          business={pb}
          liveStatus={liveStatus}
          primary={primaryAction}
          isSaved={isSaved}
          isOwner={isOwner}
          onSave={handleSave}
          onShare={handleShare}
        />

        <div className="mt-4">
          <ProfileTabs active={tab} onChange={setTab} />
          <div className="px-4 py-4">
            {tab === 'today' && <TodayTab business={pb} />}
            {tab === 'pulse' && <PulseTab business={pb} savedCount={savedCount} isSaved={isSaved} onSave={handleSave} />}
            {tab === 'rewards' && <RewardsTab business={pb} isSaved={isSaved} onSave={handleSave} onShare={handleShare} />}
            {tab === 'community' && <CommunityTab business={pb} />}
            {tab === 'photos' && <PhotosTab business={pb} />}
            {tab === 'about' && <AboutTab business={pb} actions={contactActions} />}
          </div>
        </div>
      </div>
    </>
  );
}
