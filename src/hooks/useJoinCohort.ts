import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Mirrors the typed result returned by the join-cohort edge function /
// join_cohort RPC. The QR/link only carries a token; every outcome here is
// decided server-side.
export type JoinStatus =
  | 'success'
  | 'already_member'
  | 'full'
  | 'invalid_token'
  | 'not_signed_in'
  | 'no_profile'
  | 'error';

export interface JoinResult {
  status: JoinStatus;
  position?: number;
}

export function useJoinCohort() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<JoinResult | null>(null);

  const join = async (token: string): Promise<JoinResult> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('join-cohort', {
        body: { token },
      });
      // A non-2xx (e.g. unauthenticated) surfaces as `error`; the signed-in
      // gate upstream means we normally only get here with a valid session.
      const res: JoinResult = error
        ? { status: 'error' }
        : ((data as JoinResult) ?? { status: 'error' });
      setResult(res);
      return res;
    } catch {
      const res: JoinResult = { status: 'error' };
      setResult(res);
      return res;
    } finally {
      setLoading(false);
    }
  };

  return { join, loading, result };
}
