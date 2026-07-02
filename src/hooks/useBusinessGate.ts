import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { type BusinessCategory, resolveBusinessCategory } from '@/lib/profile-modules';

export interface BusinessGate {
  id: string;
  name: string;
  businessCategory: BusinessCategory;
  tier_status: string | null;
}

export function useBusinessGate() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['business-gate', user?.id],
    queryFn: async (): Promise<BusinessGate | null> => {
      if (!user) return null;

      const columns = 'id, name, tier_status, category:categories!category_id(name, icon)';

      const { data: owned, error } = await supabase
        .from('businesses')
        .select(columns)
        .eq('owner_user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      const toGate = (row: typeof owned): BusinessGate | null => {
        if (!row) return null;
        const cat = row.category as { name: string; icon: string | null } | null;
        return {
          id: row.id,
          name: row.name,
          businessCategory: resolveBusinessCategory(cat?.name, cat?.icon),
          tier_status: row.tier_status,
        };
      };

      if (owned) return toGate(owned);

      const { data: managed, error: managedError } = await supabase
        .from('business_staff')
        .select(`business:businesses(${columns})`)
        .eq('user_id', user.id)
        .eq('role', 'manager')
        .maybeSingle();

      if (managedError) throw managedError;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return toGate((managed as any)?.business ?? null);
    },
    enabled: !!user,
  });
}
