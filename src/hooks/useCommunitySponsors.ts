import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProjectSponsor {
  id: string;
  nonprofit_id: string;
  business_id: string;
  project_name: string;
  role: 'sponsor' | 'donor' | 'wishlist_fulfiller' | 'event_host';
  description: string | null;
  status: string;
  created_at: string;
  business?: {
    id: string;
    name: string;
    slug: string | null;
    profile_picture_url: string | null;
  } | null;
}

export function useProjectSponsors(nonprofitId: string | undefined) {
  return useQuery({
    queryKey: ['project-sponsors', nonprofitId],
    queryFn: async () => {
      if (!nonprofitId) return [];

      const { data, error } = await supabase
        .from('community_project_sponsors')
        .select(`
          id, nonprofit_id, business_id, project_name, role, description, status, created_at,
          business:businesses(id, name, slug, profile_picture_url)
        `)
        .eq('nonprofit_id', nonprofitId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as ProjectSponsor[];
    },
    enabled: !!nonprofitId,
  });
}
