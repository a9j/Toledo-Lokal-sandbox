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
        .order('tier_status', { ascending: true })
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
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Transform to include isInLoop flag
      return data?.map(business => ({
        ...business,
        isInLoop: business.business_loop_settings?.is_active && 
          ['community', 'growth', 'pro'].includes(business.business_loop_settings?.loop_tier_id)
      }));
    },
  });
}
