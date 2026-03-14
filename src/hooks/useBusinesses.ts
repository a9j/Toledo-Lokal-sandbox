import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
      // Use businesses_public view which masks phone for unauthenticated users
      let query = supabase
        .from('businesses_public')
        .select(`
          ${PUBLIC_BUSINESS_COLUMNS},
          neighborhood:neighborhoods(id, name),
          category:categories(id, name, icon),
          business_loop_settings(is_active, loop_tier_id)
        `)
        .order('created_at', { ascending: false });
      
      if (options?.featured) {
        query = query.eq('featured', true);
      }

      if (options?.categoryId) {
        query = query.eq('category_id', options.categoryId);
      }

      if (options?.neighborhoodId) {
        query = query.eq('neighborhood_id', options.neighborhoodId);
      }
      
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      let { data, error } = await query;
      if (error) throw error;

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
              const { data: extraBiz } = await supabase
                .from('businesses_public')
                .select(`
                  ${PUBLIC_BUSINESS_COLUMNS},
                  neighborhood:neighborhoods(id, name),
                  category:categories(id, name, icon),
                  business_loop_settings(is_active, loop_tier_id)
                `)
                .in('id', extraIds);

              if (extraBiz) {
                data = [...data, ...extraBiz];
              }
            }
          }
        }
      }
      
      // Sort by tier priority: founding_5 > pro > founding_50 > growth > community
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
        isInLoop: business.business_loop_settings?.is_active && 
          ['community', 'growth', 'pro'].includes(business.business_loop_settings?.loop_tier_id)
      }));
    },
  });
}
