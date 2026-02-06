import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface SecureImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  storagePath?: string | null;
  fallback?: React.ReactNode;
  expiresIn?: number;
  /** Image size hint for responsive loading */
  size?: 'thumb' | 'medium' | 'large' | 'full';
  /** Use blur-up loading effect */
  blurUp?: boolean;
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

// Supabase project URL for public bucket access
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ixupthihhfeikeydvvir.supabase.co';

// Size presets for responsive images
const SIZE_PRESETS = {
  thumb: { width: 150, quality: 75 },
  medium: { width: 600, quality: 80 },
  large: { width: 1200, quality: 85 },
  full: { width: 1920, quality: 90 },
};

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

// Check if this is an external URL (Unsplash, etc.)
function isExternalUrl(url: string): boolean {
  return url.startsWith('http') && !url.includes('supabase.co');
}

// Extract file path from Supabase storage URL
function extractPathFromUrl(url: string): string | null {
  const match = url.match(/\/storage\/v1\/object\/(?:public|sign)\/uploads\/(.+?)(?:\?|$)/);
  return match ? match[1] : null;
}

// Generate a direct public URL for the uploads bucket
function getPublicUrl(filePath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/uploads/${filePath}`;
}

// Generate a transformed image URL with size optimization
function getTransformedUrl(filePath: string, size: keyof typeof SIZE_PRESETS): string {
  const preset = SIZE_PRESETS[size];
  return `${SUPABASE_URL}/storage/v1/render/image/public/uploads/${filePath}?width=${preset.width}&quality=${preset.quality}`;
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
  size = 'medium',
  blurUp = true,
  className,
  alt = '',
  loading = 'lazy',
  ...props
}: SecureImageProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [useSignedFallback, setUseSignedFallback] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const mountedRef = useRef(true);
  const imgRef = useRef<HTMLImageElement>(null);

  // Determine if this is a public/external image that doesn't need signing
  const immediateUrl = useMemo(() => {
    if (!storagePath) return null;
    
    // External URLs (Unsplash, etc.) - use directly
    if (isExternalUrl(storagePath)) {
      return storagePath;
    }
    
    // Already a full Supabase URL with signature
    if (storagePath.includes('/storage/v1/object/sign/')) {
      return storagePath;
    }
    
    return null;
  }, [storagePath]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    // If we have an immediate URL, use it
    if (immediateUrl) {
      setSignedUrl(immediateUrl);
      setIsLoading(false);
      return;
    }

    if (!storagePath) {
      setIsLoading(false);
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
        setIsLoading(false);
        return;
      }
      filePath = extracted;
    } else {
      // External URL, use as-is
      setSignedUrl(storagePath);
      setIsLoading(false);
      return;
    }

    // Check cache first
    const cached = getCachedUrl(filePath);
    if (cached) {
      setSignedUrl(cached);
      setIsLoading(false);
      return;
    }

    // Try public URL first for business images (fast path)
    // Use transformed URL for size optimization
    if (filePath.startsWith('businesses/') && !useSignedFallback) {
      const publicUrl = size !== 'full' 
        ? getTransformedUrl(filePath, size)
        : getPublicUrl(filePath);
      setSignedUrl(publicUrl);
      setIsLoading(false);
      return;
    }

    // Fetch signed URL for private content
    setIsLoading(true);
    setError(false);
    
    fetchSignedUrl(filePath, expiresIn).then((url) => {
      if (!mountedRef.current) return;
      if (url) {
        setSignedUrl(url);
      } else {
        setError(true);
      }
      setIsLoading(false);
    });
  }, [storagePath, expiresIn, immediateUrl, useSignedFallback, size]);

  // Handle image load error - fallback to signed URL if public URL fails
  const handleError = () => {
    if (!useSignedFallback && storagePath && (isStoragePath(storagePath) || isSupabaseStorageUrl(storagePath))) {
      // The public/transformed URL failed, try getting a signed URL
      setUseSignedFallback(true);
    } else {
      setError(true);
    }
  };

  const handleLoad = () => {
    setImageLoaded(true);
  };

  if (isLoading) {
    return <Skeleton className={className} />;
  }

  if (error || !signedUrl) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Blur placeholder while loading */}
      {blurUp && !imageLoaded && (
        <div 
          className="absolute inset-0 bg-muted animate-pulse"
          style={{ backdropFilter: 'blur(10px)' }}
        />
      )}
      <img
        ref={imgRef}
        src={signedUrl}
        alt={alt}
        loading={loading}
        onError={handleError}
        onLoad={handleLoad}
        className={cn(
          "w-full h-full",
          blurUp && !imageLoaded && "opacity-0",
          blurUp && imageLoaded && "opacity-100 transition-opacity duration-300"
        )}
        {...props}
      />
    </div>
  );
}
