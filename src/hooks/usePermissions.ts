import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppRole, Capability, capabilitiesFor } from '@/lib/permissions';

export function usePermissions() {
  const { roles } = useAuth();
  const capabilities = useMemo(() => capabilitiesFor((roles ?? []) as AppRole[]), [roles]);
  return {
    can: (capability: Capability) => capabilities.has(capability),
    capabilities,
  };
}
