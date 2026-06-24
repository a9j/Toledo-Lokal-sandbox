import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MapsKeyResult {
  apiKey: string | null;
  error: string | null;
}

// Preferred source: a build-time public key. Google Maps JS keys are designed
// to be exposed client-side and locked down with an HTTP-referrer restriction
// in the Google Cloud console, so this is the standard, robust delivery path.
// When present it lets every map render with no auth and no network round-trip —
// including for logged-out visitors — and sidesteps the `get-maps-key` edge
// function entirely (which only works for signed-in users and silently breaks
// the whole map if its GOOGLE_MAPS_API_KEY secret is ever missing).
const ENV_MAPS_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim() || null;

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
  // If a build-time key is configured, use it immediately — no loading state,
  // no edge-function call, works for everyone (including logged-out users).
  const [apiKey, setApiKey] = useState<string | null>(ENV_MAPS_KEY);
  const [isLoading, setIsLoading] = useState(!ENV_MAPS_KEY);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ENV_MAPS_KEY) return;
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
