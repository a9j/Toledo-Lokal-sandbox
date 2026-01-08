import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface SecureImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  storagePath?: string | null;
  fallback?: React.ReactNode;
  expiresIn?: number;
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

  useEffect(() => {
    let mounted = true;

    async function getSignedUrl() {
      if (!storagePath) {
        setLoading(false);
        return;
      }

      // Determine the actual file path
      let filePath: string;
      
      if (isStoragePath(storagePath)) {
        // It's already a storage path
        filePath = storagePath;
      } else if (isSupabaseStorageUrl(storagePath)) {
        // Extract path from URL
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

      try {
        const { data, error: fnError } = await supabase.functions.invoke('get-signed-url', {
          body: { filePath, expiresIn }
        });

        if (!mounted) return;

        if (fnError || !data?.signedUrl) {
          console.error('Failed to get signed URL:', fnError);
          setError(true);
        } else {
          setSignedUrl(data.signedUrl);
        }
      } catch (err) {
        console.error('Error getting signed URL:', err);
        if (mounted) setError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    setLoading(true);
    setError(false);
    getSignedUrl();

    return () => {
      mounted = false;
    };
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
      onError={() => setError(true)}
      {...props}
    />
  );
}
