import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';

type CauseCategory = Database['public']['Enums']['cause_category'];
type CommunitySupportType = Database['public']['Enums']['community_support_type'];

export interface Nonprofit {
  id: string;
  name: string;
  slug: string | null;
  cause_category: CauseCategory;
  neighborhood_id: string | null;
  mission_statement: string;
  what_this_helps: string | null;
  community_support_types: CommunitySupportType[];
  human_note: string | null;
  founding_community_partner: boolean;
  claimed: boolean;
  claimed_by: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  neighborhood?: {
    id: string;
    name: string;
  } | null;
}

interface UseNonprofitsOptions {
  causeCategory?: CauseCategory;
  neighborhoodId?: string;
  foundingOnly?: boolean;
  limit?: number;
}

export const CAUSE_CATEGORY_LABELS: Record<CauseCategory, string> = {
  food_insecurity: 'Food Insecurity',
  housing: 'Housing',
  youth: 'Youth',
  health: 'Health',
  arts_culture: 'Arts & Culture',
  education: 'Education',
  community_support: 'Community Support',
  environment: 'Environment',
  animal_welfare: 'Animal Welfare',
  veterans: 'Veterans',
  seniors: 'Seniors',
  disability_services: 'Disability Services',
};

export const COMMUNITY_SUPPORT_LABELS: Record<CommunitySupportType, string> = {
  volunteers: 'Volunteers',
  donations: 'Donations',
  supplies: 'Supplies',
  events: 'Events',
  awareness: 'Awareness',
};

export function useNonprofits(options: UseNonprofitsOptions = {}) {
  const { causeCategory, neighborhoodId, foundingOnly, limit } = options;

  return useQuery({
    queryKey: ['nonprofits', causeCategory, neighborhoodId, foundingOnly, limit],
    queryFn: async () => {
      let query = supabase
        .from('nonprofits')
        .select(`
          *,
          neighborhood:neighborhoods(id, name)
        `)
        .eq('status', 'active')
        .order('founding_community_partner', { ascending: false })
        .order('name');

      if (causeCategory) {
        query = query.eq('cause_category', causeCategory);
      }

      if (neighborhoodId) {
        query = query.eq('neighborhood_id', neighborhoodId);
      }

      if (foundingOnly) {
        query = query.eq('founding_community_partner', true);
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Nonprofit[];
    },
  });
}

export function useNonprofit(slugOrId: string | undefined) {
  return useQuery({
    queryKey: ['nonprofit', slugOrId],
    queryFn: async () => {
      if (!slugOrId) return null;

      // Try by slug first, then by ID
      let { data, error } = await supabase
        .from('nonprofits')
        .select(`
          *,
          neighborhood:neighborhoods(id, name)
        `)
        .eq('slug', slugOrId)
        .eq('status', 'active')
        .single();

      if (error && error.code === 'PGRST116') {
        // Not found by slug, try by ID
        const result = await supabase
          .from('nonprofits')
          .select(`
            *,
            neighborhood:neighborhoods(id, name)
          `)
          .eq('id', slugOrId)
          .eq('status', 'active')
          .single();
        
        data = result.data;
        error = result.error;
      }

      if (error) throw error;
      return data as Nonprofit;
    },
    enabled: !!slugOrId,
  });
}

export function useClaimNonprofit() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (nonprofitId: string) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('nonprofits')
        .update({
          claimed: true,
          claimed_by: user.id,
          claimed_at: new Date().toISOString(),
        })
        .eq('id', nonprofitId)
        .eq('claimed', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nonprofits'] });
      queryClient.invalidateQueries({ queryKey: ['nonprofit'] });
    },
  });
}

export function useUserClaimedNonprofit() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-claimed-nonprofit', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('nonprofits')
        .select(`
          *,
          neighborhood:neighborhoods(id, name)
        `)
        .eq('claimed_by', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as Nonprofit | null;
    },
    enabled: !!user,
  });
}
