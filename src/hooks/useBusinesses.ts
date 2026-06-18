import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LP_ENABLED } from '@/lib/flags';

// Define public-safe columns that don't expose owner_user_id
const PUBLIC_BUSINESS_COLUMNS = `
  id,
  name,
  slug,
  description,
  address,
  phone,
  website,
  instagram,
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
  created_at,
  updated_at
`;

export function useBusinesses(options?: { featured?: boolean; limit?: number; categoryId?: string; neighborhoodId?: string }) {
  return useQuery({
    queryKey: ['businesses', options],
    queryFn: async () => {
      // A business appears in a category bucket via its primary category
      // (businesses.category_id) OR via a secondary tag in business_categories.
      // Resolve the full set of matching business ids up front and filter with a
      // single `.in('id', ...)`. This is more robust than a PostgREST `.or()`
      // string (which combined awkwardly with the view's embedded resources).
      let categoryMatchIds: string[] | null = null;
      if (options?.categoryId) {
        const [primaryRes, taggedRes] = await Promise.all([
          supabase
            .from('businesses_public')
            .select('id')
            .eq('status', 'approved')
            .eq('category_id', options.categoryId),
          supabase
            .from('business_categories')
            .select('business_id')
            .eq('category_id', options.categoryId),
        ]);
        const ids = new Set<string>();
        (primaryRes.data ?? []).forEach((r: { id: string }) => ids.add(r.id));
        (taggedRes.data ?? []).forEach((r: { business_id: string }) => ids.add(r.business_id));
        categoryMatchIds = [...ids];
      }

      // Use businesses_public view which masks phone for unauthenticated users.
      // Note: do NOT embed related resources here (neighborhoods, categories,
      // business_loop_settings). PostgREST embeds on this view→table are
      // unreliable and 400 the whole request, which makes every list render
      // empty ("No businesses found"). Category/neighborhood are resolved from
      // lightweight lookup maps below; loop membership is fetched separately.
      let query = supabase
        .from('businesses_public')
        .select(PUBLIC_BUSINESS_COLUMNS)
        // Public lists only ever show approved businesses. The businesses_public
        // view also returns the viewer's own pending businesses (for previews),
        // so this filter keeps pending/rejected out of public lineups.
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (options?.featured) {
        query = query.eq('featured', true);
      }

      if (options?.categoryId) {
        query = query.in('id', categoryMatchIds ?? []);
      }

      if (options?.neighborhoodId) {
        query = query.eq('neighborhood_id', options.neighborhoodId);
      }
      
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      const result = await query;
      if (result.error) throw result.error;
      let data = result.data;

      // If filtering by neighborhood, also include businesses with locations in that neighborhood
      if (options?.neighborhoodId && data) {
        // Get the neighborhood name for location matching
        const { data: neighborhood } = await supabase
          .from('neighborhoods')
          .select('name')
          .eq('id', options.neighborhoodId)
          .single();

        if (neighborhood?.name) {
          const existingIds = new Set(data.map(b => b.id));
          const { data: locationMatches } = await supabase
            .from('business_locations')
            .select('business_id')
            .eq('neighborhood', neighborhood.name)
            .eq('is_active', true);

          if (locationMatches && locationMatches.length > 0) {
            const extraIds = locationMatches
              .map(l => l.business_id)
              .filter(id => !existingIds.has(id));

            if (extraIds.length > 0) {
              // Location-based matches must still satisfy every other active
              // filter, otherwise the neighborhood filter behaves as an OR
              // across filter types (e.g. a Shopping business with a Sylvania
              // location leaking into an "Auto & Transport + Sylvania" search).
              let extraQuery = supabase
                .from('businesses_public')
                .select(PUBLIC_BUSINESS_COLUMNS)
                .eq('status', 'approved')
                .in('id', extraIds);

              if (options?.featured) {
                extraQuery = extraQuery.eq('featured', true);
              }

              if (options?.categoryId) {
                extraQuery = extraQuery.in('id', categoryMatchIds ?? []);
              }

              const { data: extraBiz } = await extraQuery;

              if (extraBiz) {
                data = [...data, ...extraBiz];
              }
            }
          }
        }
      }
      
      // Sort by tier priority: founding_5 > pro > founding_50 > growth > community/civic_partner
      const tierPriority: Record<string, number> = {
        founding_5: 1,
        pro: 2,
        founding_50: 3,
        growth: 4,
        community: 5,
        civic_partner: 5,
      };
      
      const sorted = data?.sort((a, b) => {
        const aPriority = tierPriority[a.tier_status || 'community'] || 5;
        const bPriority = tierPriority[b.tier_status || 'community'] || 5;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      // Resolve category + neighborhood from lightweight lookup maps instead of
      // PostgREST embeds (see note on the main query above). Both tables are
      // tiny and readable by anon, so a single fetch of each is cheap.
      const categoryById = new Map<string, { id: string; name: string; icon: string | null }>();
      const neighborhoodById = new Map<string, { id: string; name: string }>();
      if (sorted && sorted.length > 0) {
        const [catRes, nbRes] = await Promise.all([
          supabase.from('categories').select('id, name, icon'),
          supabase.from('neighborhoods').select('id, name'),
        ]);
        (catRes.data ?? []).forEach(c => categoryById.set(c.id, c));
        (nbRes.data ?? []).forEach(n => neighborhoodById.set(n.id, n));
      }

      // Loop membership drives the ∞ badge, but only when the Loop program is
      // live. Fetch it in a separate query (the businesses_public→
      // business_loop_settings embed is unreliable and 400s the whole request).
      const loopByBusiness = new Map<string, { is_active: boolean | null; loop_tier_id: string | null }>();
      if (LP_ENABLED && sorted && sorted.length > 0) {
        const { data: loopRows } = await supabase
          .from('business_loop_settings')
          .select('business_id, is_active, loop_tier_id')
          .in('business_id', sorted.map(b => b.id));
        (loopRows ?? []).forEach(r => loopByBusiness.set(r.business_id, r));
      }

      return sorted?.map(business => {
        const loop = loopByBusiness.get(business.id);
        return {
          ...business,
          category: business.category_id ? categoryById.get(business.category_id) ?? null : null,
          neighborhood: business.neighborhood_id ? neighborhoodById.get(business.neighborhood_id) ?? null : null,
          isInLoop: !!(LP_ENABLED && loop?.is_active &&
            ['community', 'growth', 'pro'].includes(loop?.loop_tier_id ?? '')),
        };
      });
    },
  });
}
