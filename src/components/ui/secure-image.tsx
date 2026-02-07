import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  isExternalUrl,
  isStoragePath,
  isSignedUrl,
  getCachedUrl,
  setCachedUrl,
  extractPathFromUrl,
  getSignedUrl,
} from '@/lib/image-cache';

interface SecureImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  storagePath?: string | null;
  fallback?: React.ReactNode;
  expiresIn?: number;
  /** Priority loading - skips lazy load */
  priority?: boolean;
  /** Use blur-up loading effect */
  blurUp?: boolean;
}

export function SecureImage({
  storagePath,
  fallback,
  expiresIn = 3600,
  priority = false,
  blurUp = true,
  className,
  alt = '',
  ...props
}: SecureImageProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const mountedRef = useRef(true);
  const imgRef = useRef<HTMLImageElement>(null);

  // Determine if this is an immediate URL (external or already signed)
  const immediateUrl = useMemo(() => {
    if (!storagePath) return null;
    if (isExternalUrl(storagePath)) return storagePath;
    if (isSignedUrl(storagePath)) return storagePath;
    return null;
  }, [storagePath]);

  // Get the actual file path for storage paths
  const filePath = useMemo(() => {
    if (!storagePath || immediateUrl) return null;
    if (isStoragePath(storagePath)) return storagePath;
    return extractPathFromUrl(storagePath);
  }, [storagePath, immediateUrl]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    // Immediate URL - use directly
    if (immediateUrl) {
      setSignedUrl(immediateUrl);
      setIsLoading(false);
      return;
    }

    // No path provided
    if (!filePath) {
      setIsLoading(false);
      return;
    }

    // Check cache first (synchronous)
    const cached = getCachedUrl(filePath);
    if (cached) {
      setSignedUrl(cached);
      setIsLoading(false);
      return;
    }

    // Fetch signed URL using batched system
    setIsLoading(true);
    setError(false);

    getSignedUrl(filePath).then((url) => {
      if (!mountedRef.current) return;
      if (url) {
        setSignedUrl(url);
      } else {
        setError(true);
      }
      setIsLoading(false);
    });
  }, [filePath, immediateUrl]);

  const handleError = useCallback(() => {
    setError(true);
  }, []);

  const handleLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

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
          aria-hidden="true"
        />
      )}
      <img
        ref={imgRef}
        src={signedUrl}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        onError={handleError}
        onLoad={handleLoad}
        className={cn(
          "w-full h-full",
          blurUp && !imageLoaded && "opacity-0",
          blurUp && imageLoaded && "opacity-100 transition-opacity duration-200"
        )}
        {...props}
      />
    </div>
  );
}

// Re-export utility for prefetching
export { prefetchSignedUrls } from '@/lib/image-cache';
