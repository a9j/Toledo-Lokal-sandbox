import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Live cohort data for a cohort page. The seat count comes from the same
// cohort_seat_count() the cap enforcement is built around — it's the single
// source of truth, never a faked or padded number.
export interface CohortMeta {
  id: string;
  slug: string;
  name: string;
  mission: string | null;
  access_type: 'open' | 'closed';
  member_cap: number | null;
  status: 'forming' | 'active' | 'full' | 'archived';
}

export function useCohort(slug = 'charter-100') {
  const { user } = useAuth();

  const cohort = useQuery({
    queryKey: ['cohort', slug],
    queryFn: async (): Promise<CohortMeta | null> => {
      const { data, error } = await supabase
        .from('cohorts' as never)
        .select('id, slug, name, mission, access_type, member_cap, status')
        .eq('slug', slug)
        .single();
      if (error) throw error;
      return data as unknown as CohortMeta;
    },
  });

  const seats = useQuery({
    queryKey: ['cohort-seats', slug],
    queryFn: async (): Promise<{ joined: number; cap: number }> => {
      const { data, error } = await supabase.rpc('cohort_seat_count' as never, {
        p_slug: slug,
      } as never);
      if (error) throw error;
      const rows = data as unknown as { joined?: number; cap?: number }[] | null;
      const row = Array.isArray(rows) ? rows[0] : rows;
      return {
        joined: Number(row?.joined ?? 0),
        cap: Number(row?.cap ?? 100),
      };
    },
  });

  // The caller's own membership (position), if any. RLS limits this to the
  // user's own row, so a plain select is safe.
  const membership = useQuery({
    queryKey: ['cohort-membership', slug, user?.id],
    enabled: !!user && !!cohort.data?.id,
    queryFn: async (): Promise<{ position: number } | null> => {
      const { data, error } = await supabase
        .from('cohort_members' as never)
        .select('position')
        .eq('cohort_id', cohort.data!.id)
        .maybeSingle();
      if (error) throw error;
      return data ? { position: (data as { position: number }).position } : null;
    },
  });

  return {
    cohort: cohort.data ?? null,
    seats: seats.data ?? { joined: 0, cap: 100 },
    membership: membership.data ?? null,
    isLoading: cohort.isLoading || seats.isLoading,
    refetchSeats: seats.refetch,
  };
}

// Set of user_ids holding the Charter 100 badge — one small query (cap 100),
// world-readable. Lets author rows show the badge without an N+1.
export function useCharter100Members() {
  return useQuery({
    queryKey: ['charter100-badge-userids'],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await supabase
        .from('profile_badges' as never)
        .select('profiles(user_id)')
        .eq('badge_key', 'charter100');
      if (error) throw error;
      const ids = (data as unknown as { profiles?: { user_id?: string } }[] | null) ?? [];
      return new Set(
        ids
          .map((r) => r.profiles?.user_id)
          .filter((v): v is string => typeof v === 'string'),
      );
    },
  });
}
