import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// In-memory cache for signed URLs with expiration tracking
interface CacheEntry {
  signedUrl: string;
  expiresAt: number; // timestamp
}

const signedUrlCache = new Map<string, CacheEntry>();

// Cache duration buffer (5 minutes before actual expiry)
const CACHE_BUFFER_MS = 5 * 60 * 1000;

function getCachedUrl(filePath: string): string | null {
  const entry = signedUrlCache.get(filePath);
  if (!entry) return null;
  
  // Check if still valid (with buffer)
  if (Date.now() < entry.expiresAt - CACHE_BUFFER_MS) {
    return entry.signedUrl;
  }
  
  // Expired or about to expire
  signedUrlCache.delete(filePath);
  return null;
}

function setCachedUrl(filePath: string, signedUrl: string, expiresInSeconds: number): void {
  signedUrlCache.set(filePath, {
    signedUrl,
    expiresAt: Date.now() + expiresInSeconds * 1000,
  });
}

interface UseSignedUrlOptions {
  expiresIn?: number; // seconds, default 1 hour
  refreshBuffer?: number; // seconds before expiry to refresh, default 5 minutes
}

// Create a signed URL directly via the client SDK. Used as a fallback when the
// get-signed-url edge function is unavailable (e.g. not deployed → 404). The
// uploads bucket is private, but RLS lets owners/admins read their own paths, so
// the authenticated client can mint a signed URL without the edge function.
async function createSignedUrlDirect(filePath: string, expiresIn: number): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('uploads')
    .createSignedUrl(filePath, expiresIn);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export function useSignedUrl(
  storagePath: string | null | undefined,
  options: UseSignedUrlOptions = {}
) {
  const { expiresIn = 3600, refreshBuffer = 300 } = options;
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSignedUrl = useCallback(async (path: string) => {
    // Check cache first
    const cached = getCachedUrl(path);
    if (cached) {
      setSignedUrl(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let url: string | null = null;

      // Prefer the edge function (service-role, works for cross-owner reads),
      // but fall back to the client SDK if it's unavailable (e.g. 404 when the
      // function isn't deployed) so images still load.
      const { data, error: fnError } = await supabase.functions.invoke('get-signed-url', {
        body: { filePath: path, expiresIn }
      });
      if (!fnError && data?.signedUrl) {
        url = data.signedUrl;
      } else {
        url = await createSignedUrlDirect(path, expiresIn);
      }

      if (url) {
        setCachedUrl(path, url, expiresIn);
        setSignedUrl(url);
      } else {
        throw new Error('No signed URL returned');
      }
    } catch (err) {
      console.error('Failed to get signed URL:', err);
      setError(err instanceof Error ? err.message : 'Failed to load image');
      setSignedUrl(null);
    } finally {
      setLoading(false);
    }
  }, [expiresIn]);

  useEffect(() => {
    if (!storagePath) {
      setSignedUrl(null);
      return;
    }

    // Extract the file path from a full URL if needed
    let filePath = storagePath;
    
    // Check if it's already a signed URL or external URL
    if (storagePath.startsWith('http')) {
      // If it contains our storage URL, extract the path
      const storageMatch = storagePath.match(/\/storage\/v1\/object\/(?:public|sign)\/uploads\/(.+?)(?:\?|$)/);
      if (storageMatch) {
        filePath = storageMatch[1];
      } else {
        // External URL or already processed, use as-is
        setSignedUrl(storagePath);
        return;
      }
    }

    fetchSignedUrl(filePath);

    // Set up refresh before expiry
    const refreshInterval = setInterval(() => {
      fetchSignedUrl(filePath);
    }, (expiresIn - refreshBuffer) * 1000);

    return () => clearInterval(refreshInterval);
  }, [storagePath, fetchSignedUrl, expiresIn, refreshBuffer]);

  return { signedUrl, loading, error, refresh: () => storagePath && fetchSignedUrl(storagePath) };
}

// Helper function to extract storage path from URL
export function extractStoragePath(url: string | null | undefined): string | null {
  if (!url) return null;
  
  if (!url.startsWith('http')) {
    return url; // Already a path
  }
  
  const storageMatch = url.match(/\/storage\/v1\/object\/(?:public|sign)\/uploads\/(.+?)(?:\?|$)/);
  if (storageMatch) {
    return storageMatch[1];
  }
  
  return null; // External URL
}

// Generate a signed URL immediately (for upload callbacks) - with caching
export async function generateSignedUrl(filePath: string, expiresIn = 3600): Promise<string | null> {
  // Check cache first
  const cached = getCachedUrl(filePath);
  if (cached) return cached;

  try {
    const { data, error } = await supabase.functions.invoke('get-signed-url', {
      body: { filePath, expiresIn }
    });

    if (!error && data?.signedUrl) {
      setCachedUrl(filePath, data.signedUrl, expiresIn);
      return data.signedUrl;
    }

    // Edge function unavailable (e.g. not deployed → 404). Fall back to the
    // client SDK so uploads don't appear to fail and images still load.
    const direct = await createSignedUrlDirect(filePath, expiresIn);
    if (direct) {
      setCachedUrl(filePath, direct, expiresIn);
      return direct;
    }
    return null;
  } catch (err) {
    console.error('Failed to generate signed URL:', err);
    const direct = await createSignedUrlDirect(filePath, expiresIn);
    if (direct) setCachedUrl(filePath, direct, expiresIn);
    return direct;
  }
}
