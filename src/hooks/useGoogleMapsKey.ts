import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MapsKeyResult {
  apiKey: string | null;
  error: string | null;
}

// Cache the key fetch at module scope so multiple maps on a page (e.g. one per
// business location) share a single edge-function call instead of each firing
// their own request.
let cachedKeyPromise: Promise<MapsKeyResult> | null = null;

async function fetchMapsKey(): Promise<MapsKeyResult> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { apiKey: null, error: 'Authentication required' };
  }

  const { data, error } = await supabase.functions.invoke('get-maps-key');
  if (error) {
    console.error('Error fetching maps key:', error);
    return { apiKey: null, error: 'Failed to load maps' };
  }
  if (data?.apiKey) {
    return { apiKey: data.apiKey, error: null };
  }
  if (data?.error === 'Unauthorized') {
    return { apiKey: null, error: 'Authentication required' };
  }
  return { apiKey: null, error: 'Maps not configured' };
}

function getMapsKey(): Promise<MapsKeyResult> {
  if (!cachedKeyPromise) {
    cachedKeyPromise = fetchMapsKey().catch((err) => {
      // Don't cache failures, so a transient error can be retried on next mount.
      cachedKeyPromise = null;
      console.error('Error fetching maps key:', err);
      return { apiKey: null, error: 'Failed to load maps' };
    });
  }
  return cachedKeyPromise;
}

export function useGoogleMapsKey() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getMapsKey().then((result) => {
      if (!active) return;
      setApiKey(result.apiKey);
      setError(result.error);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  return { apiKey, isLoading, error };
}
