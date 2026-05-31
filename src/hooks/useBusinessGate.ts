import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { BusinessCategory } from '@/lib/profile-modules';

// Lightweight fetch of just the fields the dashboard needs to decide which
// features to show: the `business_category` enum (for Menu / food-truck gating)
// and `tier_status` (for the Loop gate). Mirrors the owned-then-managed lookup
// the full dashboard query uses, so managers see the same gating as owners.
export interface BusinessGate {
  id: string;
  name: string;
  category: BusinessCategory | null;
  tier_status: string | null;
}

export function useBusinessGate() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['business-gate', user?.id],
    queryFn: async (): Promise<BusinessGate | null> => {
      if (!user) return null;

      const columns = 'id, name, category, tier_status';

      // Business the user owns takes precedence.
      const { data: owned, error } = await supabase
        .from('businesses')
        .select(columns)
        .eq('owner_user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (owned) return owned as BusinessGate;

      // Otherwise, a business the user manages (business_staff role='manager').
      const { data: managed, error: managedError } = await supabase
        .from('business_staff')
        .select(`business:businesses(${columns})`)
        .eq('user_id', user.id)
        .eq('role', 'manager')
        .maybeSingle();

      if (managedError) throw managedError;
      return (managed?.business as BusinessGate) ?? null;
    },
    enabled: !!user,
  });
}
