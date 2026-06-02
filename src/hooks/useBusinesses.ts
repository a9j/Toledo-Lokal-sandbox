import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LP_ENABLED } from '@/lib/flags';
import { buildCategoryOrFilter } from '@/lib/category-filter';

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
      // Resolve any secondary-tag matches up front so we can OR them in. A
      // PostgREST `.or()` string applies the same primary-or-secondary match
      // everywhere we filter by category; when there are no secondary matches we
      // fall back to a plain equality on category_id.
      let categoryOrFilter: string | null = null;
      if (options?.categoryId) {
        const { data: tagged } = await supabase
          .from('business_categories')
          .select('business_id')
          .eq('category_id', options.categoryId);
        const secondaryIds = (tagged ?? []).map(t => t.business_id);
        categoryOrFilter = buildCategoryOrFilter(options.categoryId, secondaryIds);
      }

      // Use businesses_public view which masks phone for unauthenticated users
      let query = supabase
        .from('businesses_public')
        .select(`
          ${PUBLIC_BUSINESS_COLUMNS},
          neighborhood:neighborhoods(id, name),
          category:categories(id, name, icon),
          business_loop_settings(is_active, loop_tier_id)
        `)
        // Public lists only ever show approved businesses. The businesses_public
        // view also returns the viewer's own pending businesses (for previews),
        // so this filter keeps pending/rejected out of public lineups.
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (options?.featured) {
        query = query.eq('featured', true);
      }

      if (options?.categoryId) {
        query = categoryOrFilter
          ? query.or(categoryOrFilter)
          : query.eq('category_id', options.categoryId);
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
                .select(`
                  ${PUBLIC_BUSINESS_COLUMNS},
                  neighborhood:neighborhoods(id, name),
                  category:categories(id, name, icon),
                  business_loop_settings(is_active, loop_tier_id)
                `)
                .eq('status', 'approved')
                .in('id', extraIds);

              if (options?.featured) {
                extraQuery = extraQuery.eq('featured', true);
              }

              if (options?.categoryId) {
                extraQuery = categoryOrFilter
                  ? extraQuery.or(categoryOrFilter)
                  : extraQuery.eq('category_id', options.categoryId);
              }

              const { data: extraBiz } = await extraQuery;

              if (extraBiz) {
                data = [...data, ...extraBiz];
              }
            }
          }
        }
      }
      
      // Sort by tier priority: founding_5 > pro > founding_25 > growth > community
      const tierPriority: Record<string, number> = {
        founding_5: 1,
        pro: 2,
        founding_50: 3,
        growth: 4,
        community: 5,
      };
      
      const sorted = data?.sort((a, b) => {
        const aPriority = tierPriority[a.tier_status || 'community'] || 5;
        const bPriority = tierPriority[b.tier_status || 'community'] || 5;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      // Transform to include isInLoop flag
      return sorted?.map(business => ({
        ...business,
        isInLoop: LP_ENABLED && business.business_loop_settings?.is_active &&
          ['community', 'growth', 'pro'].includes(business.business_loop_settings?.loop_tier_id)
      }));
    },
  });
}
