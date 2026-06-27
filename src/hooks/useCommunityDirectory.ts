import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CommunityOrg {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  account_type: 'nonprofit' | 'community_partner';
  address: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  neighborhood_id: string | null;
  created_at: string;
  neighborhood?: { id: string; name: string } | null;
}

const NONPROFITS_COMMUNITY_CATEGORY_ID = '94102354-adc1-4da0-91b7-de7f71e5127f';

interface UseCommunityDirectoryOptions {
  neighborhoodId?: string;
}

export function useCommunityDirectory(options: UseCommunityDirectoryOptions = {}) {
  const { neighborhoodId } = options;

  return useQuery({
    queryKey: ['community-directory', neighborhoodId],
    queryFn: async () => {
      let query = supabase
        .from('businesses')
        .select(`
          id, name, slug, description,
          address, phone, website, instagram,
          profile_picture_url, cover_image_url, neighborhood_id,
          category, created_at,
          neighborhood:neighborhoods(id, name)
        `)
        .eq('category_id', NONPROFITS_COMMUNITY_CATEGORY_ID)
        .eq('status', 'approved')
        .order('name');

      if (neighborhoodId) {
        query = query.eq('neighborhood_id', neighborhoodId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map(d => ({
        ...d,
        logo_url: (d as Record<string, unknown>).profile_picture_url as string | null,
        account_type: 'nonprofit' as const,
      })) as unknown as CommunityOrg[];
    },
  });
}

export function usePendingVerifications() {
  return useQuery({
    queryKey: ['pending-verifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select(`
          id, name, slug, description, status,
          owner_user_id, created_at,
          neighborhood:neighborhoods(id, name)
        `)
        .eq('category_id', NONPROFITS_COMMUNITY_CATEGORY_ID)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data ?? []).map(d => ({
        ...d,
        account_type: 'nonprofit' as const,
        verification_status: 'pending' as const,
      }));
    },
  });
}
