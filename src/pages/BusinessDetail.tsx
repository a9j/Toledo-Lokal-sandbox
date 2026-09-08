import { useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
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
import { resolveBusinessCategory, parseModuleContent } from '@/lib/profile-modules';
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
import { FollowButton } from '@/components/city-os/FollowButton';
import { RecentChanges } from '@/components/city-os/RecentChanges';
import { ProfileTabs } from '@/components/business/profile/redesign/ProfileTabs';
import { TodayTab } from '@/components/business/profile/redesign/TodayTab';
import { PulseTab } from '@/components/business/profile/redesign/PulseTab';
import { RewardsTab } from '@/components/business/profile/redesign/RewardsTab';
import { CommunityTab } from '@/components/business/profile/redesign/CommunityTab';
import { PhotosTab } from '@/components/business/profile/redesign/PhotosTab';
import { AboutTab } from '@/components/business/profile/redesign/AboutTab';
import { MenuTab } from '@/components/business/profile/redesign/MenuTab';
import { QrConversionBanner } from '@/components/business/QrConversionBanner';
import { fetchPublicContactCard } from '@/lib/contact-cards';
import { useAvailableMenuCount } from '@/hooks/useMenuItems';
import { FOOD_BUSINESS_CATEGORIES } from '@/lib/business-profile-config';

// Public-safe columns - owner_user_id is masked in the view for non-owners
const PUBLIC_BUSINESS_COLUMNS = `
  id, name, slug, description, address, phone, website, instagram, tiktok, facebook,
  category_id, neighborhood_id, featured, verified, average_rating, review_count,
  photos, logo_url, hours, editor_pick_image, story, status,
  tier_status, tier_badge_visible, tier_assigned_at,
  profile_picture_url, cover_image_url, owner_user_id, created_at, updated_at
`;

// visit_link_* and profile_modules ship via recent migrations.
// Selected separately so the page still loads if a migration hasn't reached the view.
const NEW_COLUMNS = 'visit_link_type, visit_link_url, profile_modules';

export default function BusinessDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  // Visitors arriving from a scanned QR code with no session get a slim, one-tap
  // nudge to install the app.
  const showQrBanner = searchParams.get('via') === 'qr' && !user;

  // When the QR carried a person (?c=), the saved contact is filed under them.
  const contactId = searchParams.get('c');
  const { data: contactCard } = useQuery({
    queryKey: ['contact-card-public', contactId],
    queryFn: () => fetchPublicContactCard(contactId!),
    enabled: !!contactId,
  });
  const { savedItems, toggleSave } = useSavedItems();
  const { data: savedCount = 0 } = useBusinessSavedCount(id || '');
  const [tab, setTab] = useState<ProfileTab>('today');
  const isUUID = id ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) : false;

  const { data: business, isLoading } = useQuery({
    queryKey: ['business', id],
    queryFn: async () => {
      if (!id) throw new Error('Business not found');
      // Read the scalar row WITHOUT relational embeds. Embedding related tables
      // from the businesses_public *view* relies on PostgREST detecting
      // view→table relationships, which is brittle: a relation it can't resolve
      // (notably the reverse business_loop_settings embed) 400s the whole
      // request and surfaces to the user as a spurious "business not found".
      // We load the related rows separately below, so a readable business always
      // renders.
      const fetchRow = (select: string) => {
        const q = supabase.from('businesses_public').select(select);
        return (isUUID ? q.eq('id', id) : q.eq('slug', id)).single();
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let { data, error } = await fetchRow(`${PUBLIC_BUSINESS_COLUMNS}, ${NEW_COLUMNS}`) as { data: any; error: unknown };
      // Retry with only the stable columns in case a newer column (visit_link_*,
      // profile_modules) hasn't reached the view yet.
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

      const resolvedCategory = resolveBusinessCategory(category?.name, category?.icon);
      const isFoodTruck = resolvedCategory === 'food_truck';
      const isNonprofit = resolvedCategory === 'nonprofit' || resolvedCategory === 'community_org';

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
        isFounding25: business_loop_settings?.is_founding_50,
        tierStatus: data.tier_status,
        tierBadgeVisible: data.tier_badge_visible,
        tierAssignedAt: data.tier_assigned_at,
        profileCategory: resolvedCategory,
        moduleContent: parseModuleContent(data.profile_modules),
      };
    },
    enabled: !!id,
  });

  // The Menu tab appears only when the business actually has at least one
  // available menu item — category alone no longer surfaces it.
  const { data: availableMenuCount = 0 } = useAvailableMenuCount(business?.id);
  const hasMenu = availableMenuCount > 0;

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

  // Menu tab requires BOTH: a food category (restaurant/food_truck) AND at
  // least one available menu item. If either is false the tab is hidden, and
  // selecting it via a non-tab path (e.g. the "View Menu" action) falls back
  // to the Today tab below.
  const showMenuTab =
    FOOD_BUSINESS_CATEGORIES.includes(pb.profileCategory) && hasMenu;

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
          contactCard={contactCard ?? null}
        />

        {/* Food-truck schedule lives above the tabs: the profile is built around
            "Now at" / "Next stop", with a Follow-the-Truck action. */}
        {!business.isFoodTruck && (
          <div className="px-4 pt-4">
            <FollowButton
              source={{ table: 'businesses', id: business.id }}
              className="w-full"
            />
          </div>
        )}

        {business.isFoodTruck && (
          <div className="space-y-3 px-4 pt-4">
            <ScheduleStopsBlock businessId={business.id} />
            <FollowButton
              source={{ table: 'businesses', id: business.id }}
              label="Follow the Truck"
              className="w-full"
            />
          </div>
        )}

        <div className="mt-4">
          <ProfileTabs
            active={tab}
            onChange={setTab}
            hiddenTabs={[
              ...(showMenuTab ? [] : ['menu' as const]),
              // The Rewards tab is Loop Points UI; keep it hidden until Loop launches.
              ...(LP_ENABLED ? [] : ['rewards' as const]),
            ]}
          />
          <div className="px-4 py-4">
            {tab === 'today' && <TodayTab business={pb} />}
            {tab === 'menu' && showMenuTab && <MenuTab businessId={business.id} />}
            {tab === 'menu' && !showMenuTab && <TodayTab business={pb} />}
            {tab === 'pulse' && <PulseTab business={pb} savedCount={savedCount} isSaved={isSaved} onSave={handleSave} />}
            {LP_ENABLED && tab === 'rewards' && <RewardsTab business={pb} isSaved={isSaved} onSave={handleSave} onShare={handleShare} />}
            {tab === 'community' && <CommunityTab business={pb} />}
            {tab === 'photos' && <PhotosTab business={pb} />}
            {tab === 'about' && <AboutTab business={pb} actions={contactActions} />}

            {/* CityGraph change log. Renders nothing when this business has no
                logged changes, so quiet profiles stay quiet. */}
            {tab === 'today' && (
              <RecentChanges
                source={{ table: 'businesses', id: business.id }}
                className="mt-4"
              />
            )}
          </div>
        </div>
      </div>

      {showQrBanner && <QrConversionBanner />}
    </>
  );
}
