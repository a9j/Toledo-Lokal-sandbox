import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface SecureAvatarProps {
  storagePath?: string | null;
  fallbackText?: string;
  className?: string;
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

export function SecureAvatar({
  storagePath,
  fallbackText = '?',
  className = 'h-10 w-10',
  expiresIn = 3600,
}: SecureAvatarProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
        filePath = storagePath;
      } else if (isSupabaseStorageUrl(storagePath)) {
        const extracted = extractPathFromUrl(storagePath);
        if (!extracted) {
          setSignedUrl(storagePath);
          setLoading(false);
          return;
        }
        filePath = extracted;
      } else {
        // External URL
        setSignedUrl(storagePath);
        setLoading(false);
        return;
      }

      try {
        const { data, error: fnError } = await supabase.functions.invoke('get-signed-url', {
          body: { filePath, expiresIn }
        });

        if (!mounted) return;

        if (!fnError && data?.signedUrl) {
          setSignedUrl(data.signedUrl);
        }
      } catch (err) {
        console.error('Error getting signed URL for avatar:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    setLoading(true);
    getSignedUrl();

    return () => {
      mounted = false;
    };
  }, [storagePath, expiresIn]);

  const initial = fallbackText.charAt(0).toUpperCase();

  return (
    <Avatar className={className}>
      <AvatarImage src={signedUrl || undefined} />
      <AvatarFallback className="bg-primary/10 text-primary">
        {initial}
      </AvatarFallback>
    </Avatar>
  );
}
