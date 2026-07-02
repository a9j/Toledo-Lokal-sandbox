import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LogoLoader } from '@/components/ui/logo-loader';
import PendingApproval from '@/pages/PendingApproval';

const OPEN_PATHS = ['/auth', '/signup', '/privacy', '/terms'];

function isOpen(path: string): boolean {
  return OPEN_PATHS.some((p) => path === p || path.startsWith(p + '/'));
}

export function AccessGate({ children }: { children: ReactNode }) {
  const { user, isLoading, hasQualifyingRole } = useAuth();
  const { pathname } = useLocation();

  if (isOpen(pathname)) return <>{children}</>;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LogoLoader size="lg" />
      </div>
    );
  }

  if (user && !hasQualifyingRole) {
    return <PendingApproval />;
  }

  return <>{children}</>;
}
