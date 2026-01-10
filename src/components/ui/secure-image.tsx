import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface SecureImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  storagePath?: string | null;
  fallback?: React.ReactNode;
  expiresIn?: number;
}

// In-memory cache for signed URLs with expiration tracking
interface CacheEntry {
  signedUrl: string;
  expiresAt: number;
}

const imageCache = new Map<string, CacheEntry>();
const CACHE_BUFFER_MS = 5 * 60 * 1000; // 5 min buffer

// Pending requests to avoid duplicate fetches
const pendingRequests = new Map<string, Promise<string | null>>();

function getCachedUrl(filePath: string): string | null {
  const entry = imageCache.get(filePath);
  if (!entry) return null;
  if (Date.now() < entry.expiresAt - CACHE_BUFFER_MS) {
    return entry.signedUrl;
  }
  imageCache.delete(filePath);
  return null;
}

function setCachedUrl(filePath: string, signedUrl: string, expiresInSeconds: number): void {
  imageCache.set(filePath, {
    signedUrl,
    expiresAt: Date.now() + expiresInSeconds * 1000,
  });
}

// Check if a path looks like a storage path (not a full URL)
function isStoragePath(path: string): boolean {
  return !path.startsWith('http') && !path.startsWith('data:');
}

// Check if URL is from our Supabase storage
function isSupabaseStorageUrl(url: string): boolean {
  return url.includes('/storage/v1/object/');
}

// Extract file path from Supabase storage URL
function extractPathFromUrl(url: string): string | null {
  const match = url.match(/\/storage\/v1\/object\/(?:public|sign)\/uploads\/(.+?)(?:\?|$)/);
  return match ? match[1] : null;
}

async function fetchSignedUrl(filePath: string, expiresIn: number): Promise<string | null> {
  // Check if there's already a pending request for this path
  const pending = pendingRequests.get(filePath);
  if (pending) return pending;

  const request = (async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-signed-url', {
        body: { filePath, expiresIn }
      });

      if (error || !data?.signedUrl) {
        console.error('Failed to get signed URL:', error);
        return null;
      }

      setCachedUrl(filePath, data.signedUrl, expiresIn);
      return data.signedUrl;
    } catch (err) {
      console.error('Error getting signed URL:', err);
      return null;
    } finally {
      pendingRequests.delete(filePath);
    }
  })();

  pendingRequests.set(filePath, request);
  return request;
}

export function SecureImage({
  storagePath,
  fallback,
  expiresIn = 3600,
  className,
  alt = '',
  ...props
}: SecureImageProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!storagePath) {
      setLoading(false);
      return;
    }

    // Determine the actual file path
    let filePath: string;
    
    if (isStoragePath(storagePath)) {
      filePath = storagePath;
    } else if (isSupabaseStorageUrl(storagePath)) {
      const extracted = extractPathFromUrl(storagePath);
      if (!extracted) {
        // Can't extract, use as-is (might be signed already)
        setSignedUrl(storagePath);
        setLoading(false);
        return;
      }
      filePath = extracted;
    } else {
      // External URL, use as-is
      setSignedUrl(storagePath);
      setLoading(false);
      return;
    }

    // Check cache first
    const cached = getCachedUrl(filePath);
    if (cached) {
      setSignedUrl(cached);
      setLoading(false);
      return;
    }

    // Fetch signed URL
    setLoading(true);
    setError(false);
    
    fetchSignedUrl(filePath, expiresIn).then((url) => {
      if (!mountedRef.current) return;
      if (url) {
        setSignedUrl(url);
      } else {
        setError(true);
      }
      setLoading(false);
    });
  }, [storagePath, expiresIn]);

  if (loading) {
    return <Skeleton className={className} />;
  }

  if (error || !signedUrl) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <img
      src={signedUrl}
      alt={alt}
      className={className}
      loading="eager"
      onError={() => setError(true)}
      {...props}
    />
  );
}
