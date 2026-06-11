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
import { ScheduleStopsBlock } from '@/components/business/ScheduleStopsBlock';
import { FollowTruckButton } from '@/components/business/FollowTruckButton';
import { ProfileTabs } from '@/components/business/profile/redesign/ProfileTabs';
import { TodayTab } from '@/components/business/profile/redesign/TodayTab';
import { PulseTab } from '@/components/business/profile/redesign/PulseTab';
import { RewardsTab } from '@/components/business/profile/redesign/RewardsTab';
import { CommunityTab } from '@/components/business/profile/redesign/CommunityTab';
import { PhotosTab } from '@/components/business/profile/redesign/PhotosTab';
import { AboutTab } from '@/components/business/profile/redesign/AboutTab';
import { MenuTab } from '@/components/business/profile/redesign/MenuTab';
import { FOOD_BUSINESS_CATEGORIES } from '@/lib/business-profile-config';

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
      // Read the scalar row WITHOUT relational embeds. Embedding related tables
      // from the businesses_public *view* relies on PostgREST detecting
      // view→table relationships, which is brittle: a relation it can't resolve
      // (notably the reverse business_loop_settings embed) 400s the whole
      // request and surfaces to the user as a spurious "business not found".
      // We load the related rows separately below, so a readable business always
      // renders. `business_category` is the scalar enum column (aliased to avoid
      // clashing with the category relation we attach afterwards).
      const fetchRow = (select: string) => {
        const q = supabase.from('businesses_public').select(select);
        return (isUUID ? q.eq('id', id) : q.eq('slug', id)).single();
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let { data, error } = await fetchRow(`${PUBLIC_BUSINESS_COLUMNS}, ${NEW_COLUMNS}`) as { data: any; error: unknown };
      // Retry with only the stable columns in case a newer column (visit_link_*,
      // category enum, profile_modules) hasn't reached the view yet.
      if (error) {
        const res = await fetchRow(PUBLIC_BUSINESS_COLUMNS);
        data = res.data;
        error = res.error;
      }
      if (error) throw error;

      // Related data via direct table reads (no view embedding). Each degrades
      // gracefully to null — e.g. business_loop_settings is RLS-restricted and
      // simply returns nothing for anonymous visitors.
      const [nbRes, catRes, loopRes] = await Promise.all([
        data.neighborhood_id
          ? supabase.from('neighborhoods').select('name').eq('id', data.neighborhood_id).maybeSingle()
          : Promise.resolve({ data: null }),
        data.category_id
          ? supabase.from('categories').select('name, icon').eq('id', data.category_id).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase
          .from('business_loop_settings')
          .select('is_active, loop_tier_id, is_founding_member, is_founding_50')
          .eq('business_id', data.id)
          .maybeSingle(),
      ]);

      const neighborhood = nbRes.data ?? null;
      const category = (catRes.data ?? null) as { name?: string; icon?: string } | null;
      const business_loop_settings = loopRes.data ?? null;

      const isFoodTruck = category?.name?.toLowerCase().includes('food truck') || category?.icon === 'truck';
      const isNonprofit = category?.name?.toLowerCase().includes('nonprofit') ||
        category?.name?.toLowerCase().includes('non-profit');

      return {
        ...data,
        neighborhood,
        category,
        business_loop_settings,
        isFoodTruck,
        isNonprofit,
        isInLoop: LP_ENABLED && business_loop_settings?.is_active &&
          ['community', 'growth', 'pro'].includes(business_loop_settings?.loop_tier_id),
        isFoundingMember: business_loop_settings?.is_founding_member,
        isFounding50: business_loop_settings?.is_founding_50,
        tierStatus: data.tier_status,
        tierBadgeVisible: data.tier_badge_visible,
        tierAssignedAt: data.tier_assigned_at,
        profileCategory: isBusinessCategory(data.business_category) ? data.business_category : 'restaurant',
        moduleContent: parseModuleContent(data.profile_modules),
      };
    },
    enabled: !!id,
  });

  // The Manage affordance shows for anyone who can administer this business —
  // the owner OR a user attached as a 'manager' via business_staff.
  const { data: canManage = false } = useQuery({
    queryKey: ['business-manage-check', business?.id || id, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const businessId = business?.id || id;
      if (!businessId) return false;

      const { data: owned } = await supabase
        .from('businesses')
        .select('id')
        .eq('id', businessId)
        .eq('owner_user_id', user.id)
        .maybeSingle();
      if (owned) return true;

      const { data: managed } = await supabase
        .from('business_staff')
        .select('id')
        .eq('business_id', businessId)
        .eq('user_id', user.id)
        .eq('role', 'manager')
        .maybeSingle();
      return !!managed;
    },
    enabled: !!user && (!!business?.id || !!id),
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

      <div className="mx-auto min-h-screen max-w-lg lg:max-w-3xl bg-background pb-24">
        <ProfileHero
          business={pb}
          liveStatus={liveStatus}
          primary={primaryAction}
          isSaved={isSaved}
          canManage={canManage}
          onSave={handleSave}
          onShare={handleShare}
        />

        {/* Food-truck schedule lives above the tabs: the profile is built around
            "Now at" / "Next stop", with a Follow-the-Truck action. */}
        {business.isFoodTruck && (
          <div className="space-y-3 px-4 pt-4">
            <ScheduleStopsBlock businessId={business.id} />
            <FollowTruckButton businessId={business.id} label="Follow the Truck" className="w-full" />
          </div>
        )}

        <div className="mt-4">
          <ProfileTabs
            active={tab}
            onChange={setTab}
            hiddenTabs={FOOD_BUSINESS_CATEGORIES.includes(pb.profileCategory) ? [] : ['menu']}
          />
          <div className="px-4 py-4">
            {tab === 'today' && <TodayTab business={pb} />}
            {tab === 'menu' && FOOD_BUSINESS_CATEGORIES.includes(pb.profileCategory) && (
              <MenuTab businessId={business.id} />
            )}
            {tab === 'menu' && !FOOD_BUSINESS_CATEGORIES.includes(pb.profileCategory) && (
              <TodayTab business={pb} />
            )}
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
