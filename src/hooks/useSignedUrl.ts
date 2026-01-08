import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseSignedUrlOptions {
  expiresIn?: number; // seconds, default 1 hour
  refreshBuffer?: number; // seconds before expiry to refresh, default 5 minutes
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
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('get-signed-url', {
        body: { filePath: path, expiresIn }
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.signedUrl) {
        setSignedUrl(data.signedUrl);
      } else {
        throw new Error('No signed URL returned');
      }
    } catch (err: any) {
      console.error('Failed to get signed URL:', err);
      setError(err.message || 'Failed to load image');
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

// Generate a signed URL immediately (for upload callbacks)
export async function generateSignedUrl(filePath: string, expiresIn = 3600): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('get-signed-url', {
      body: { filePath, expiresIn }
    });

    if (error) throw error;
    return data?.signedUrl || null;
  } catch (err) {
    console.error('Failed to generate signed URL:', err);
    return null;
  }
}
