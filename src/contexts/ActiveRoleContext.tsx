import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface BusinessSummary {
  id: string;
  name: string;
}

type ActiveView = 'personal' | string; // string = business ID

interface ActiveRoleContextType {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  businesses: BusinessSummary[];
  activeBusiness: BusinessSummary | null;
  isBusinessView: boolean;
}

const ActiveRoleContext = createContext<ActiveRoleContextType | undefined>(undefined);

export function ActiveRoleProvider({ children }: { children: ReactNode }) {
  const { user, isBusiness } = useAuth();
  const [activeView, setActiveView] = useState<ActiveView>('personal');

  const { data: businesses = [] } = useQuery({
    queryKey: ['user-businesses-list', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: owned } = await supabase
        .from('businesses')
        .select('id, name')
        .eq('owner_user_id', user.id);

      const { data: staffed } = await supabase
        .from('business_staff')
        .select('business:businesses(id, name)')
        .eq('user_id', user.id);

      const all = new Map<string, BusinessSummary>();
      owned?.forEach(b => all.set(b.id, b));
      staffed?.forEach(s => {
        const b = s.business as unknown as BusinessSummary;
        if (b) all.set(b.id, b);
      });
      return Array.from(all.values());
    },
    enabled: !!user && isBusiness,
  });

  const activeBusiness = activeView !== 'personal'
    ? businesses.find(b => b.id === activeView) ?? null
    : null;

  return (
    <ActiveRoleContext.Provider value={{
      activeView,
      setActiveView,
      businesses,
      activeBusiness,
      isBusinessView: activeView !== 'personal',
    }}>
      {children}
    </ActiveRoleContext.Provider>
  );
}

export function useActiveRole() {
  const context = useContext(ActiveRoleContext);
  if (!context) {
    throw new Error('useActiveRole must be used within an ActiveRoleProvider');
  }
  return context;
}
