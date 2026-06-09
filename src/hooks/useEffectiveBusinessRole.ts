import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { BusinessRole } from '@/lib/businessPermissions';

// Resolves the current user's effective role on a business via the
// `effective_business_role` RPC (owner via owner_user_id, else highest
// business_staff role; platform admins resolve to 'admin').
export function useEffectiveBusinessRole(businessId: string | null | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['effective-business-role', businessId, user?.id],
    queryFn: async (): Promise<BusinessRole | null> => {
      if (!businessId || !user) return null;
      const { data, error } = await supabase.rpc('effective_business_role', {
        p_business_id: businessId,
      });
      if (error) throw error;
      return (data as BusinessRole | null) ?? null;
    },
    enabled: !!businessId && !!user,
  });
}
