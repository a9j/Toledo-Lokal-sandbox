import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BETA_WINDOW_ENABLED } from '@/lib/flags';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LogoLoader } from '@/components/ui/logo-loader';
import { BetaWaitlist } from './BetaWaitlist';

// Single app-level chokepoint for the one-month beta window. When the flag is
// off this is a pure passthrough — no per-screen changes needed to open the app.
//
// When on, only beta-eligible users reach the app; everyone else gets the
// waitlist. Eligibility is the SERVER predicate is_beta_eligible (cohort member
// OR Founding 5/25 business) — never trusted from the client. The gate FAILS
// CLOSED: anything indeterminate (no session, RPC error) is treated as not
// eligible, and it shows the waitlist rather than crashing.
//
// A few paths stay reachable while gated so invited/eligible users can get in:
// the tokenized join, auth, and legal pages.
const ALLOWLIST = ['/join/charter-100', '/join', '/auth', '/signup', '/privacy', '/terms', '/beta', '/founding-5', '/business-onboarding', '/signup/nonprofit', '/signup/community-partner'];

function isAllowed(path: string): boolean {
  return ALLOWLIST.some((p) => path === p || path.startsWith(p + '/'));
}

export function BetaGate({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const { pathname } = useLocation();
  // null = still determining; the gate never assumes eligible.
  const [eligible, setEligible] = useState<boolean | null>(null);

  useEffect(() => {
    if (!BETA_WINDOW_ENABLED) return;
    let active = true;

    if (isLoading) {
      setEligible(null);
      return;
    }
    if (!user) {
      setEligible(false);
      return;
    }

    setEligible(null);
    supabase
      .rpc('is_beta_eligible' as never)
      .then(({ data, error }: { data: unknown; error: unknown }) => {
        if (!active) return;
        setEligible(!error && data === true); // fail closed
      });

    return () => {
      active = false;
    };
  }, [user, isLoading]);

  if (!BETA_WINDOW_ENABLED) return <>{children}</>;
  if (isAllowed(pathname)) return <>{children}</>;

  if (isLoading || eligible === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LogoLoader size="lg" />
      </div>
    );
  }

  if (eligible) return <>{children}</>;
  return <BetaWaitlist />;
}
