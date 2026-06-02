import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PulseTrustLevel } from '@/lib/pulse-config';

export interface PulseTrustScore {
  user_id: string;
  score: number;
  level: PulseTrustLevel;
  checkins: number;
  saves: number;
  posts: number;
  account_age_days: number;
  profile_complete: boolean;
  reports_against: number;
  is_business_owner: boolean;
  is_ambassador: boolean;
  updated_at: string;
}

// Read the current user's Pulse trust score. The score itself is computed
// server-side from real activity (no AI), via recompute_pulse_trust().
export function usePulseTrust() {
  const { user } = useAuth();

  return useQuery<PulseTrustScore | null>({
    queryKey: ['pulse-trust', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('pulse_trust_scores')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return (data as PulseTrustScore) ?? null;
    },
    enabled: !!user,
  });
}
