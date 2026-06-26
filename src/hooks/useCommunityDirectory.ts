import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CommunityOrg {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  account_type: 'nonprofit' | 'community_partner';
  verification_status: 'approved';
  address: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  neighborhood_id: string | null;
  ein: string | null;
  community_partner_mission: string | null;
  created_at: string;
  neighborhood?: { id: string; name: string } | null;
}

interface UseCommunityDirectoryOptions {
  neighborhoodId?: string;
  accountType?: 'nonprofit' | 'community_partner';
}

export function useCommunityDirectory(options: UseCommunityDirectoryOptions = {}) {
  const { neighborhoodId, accountType } = options;

  return useQuery({
    queryKey: ['community-directory', neighborhoodId, accountType],
    queryFn: async () => {
      let query = supabase
        .from('businesses')
        .select(`
          id, name, slug, description, account_type, verification_status,
          address, phone, website, instagram,
          profile_picture_url, cover_image_url, neighborhood_id,
          ein, community_partner_mission, created_at,
          neighborhood:neighborhoods(id, name)
        `)
        .in('account_type', ['nonprofit', 'community_partner'])
        .eq('verification_status', 'approved')
        .eq('status', 'approved')
        .order('name');

      if (neighborhoodId) {
        query = query.eq('neighborhood_id', neighborhoodId);
      }

      if (accountType) {
        query = query.eq('account_type', accountType);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map(d => ({
        ...d,
        logo_url: (d as Record<string, unknown>).profile_picture_url as string | null,
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
          id, name, slug, description, account_type, verification_status,
          ein, determination_letter_url, community_partner_mission,
          community_partner_reason, owner_user_id, created_at,
          neighborhood:neighborhoods(id, name)
        `)
        .in('account_type', ['nonprofit', 'community_partner'])
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });
}
