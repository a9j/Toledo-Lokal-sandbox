import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UploadOptions {
  bucket?: string;
  folder?: string;
  maxSizeMB?: number;
  allowedTypes?: string[];
  onProgress?: (progress: number) => void;
}

interface UploadResult {
  path: string;
  url: string;
}

const DEFAULT_OPTIONS: UploadOptions = {
  bucket: 'uploads',
  folder: '',
  maxSizeMB: 10,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
};

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const compressImage = useCallback(async (file: File, maxWidth: number = 1920, quality: number = 0.85): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Scale down if needed
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const upload = useCallback(async (
    file: File,
    options: UploadOptions = {}
  ): Promise<UploadResult | null> => {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    
    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Validate file type
      if (opts.allowedTypes && !opts.allowedTypes.includes(file.type)) {
        throw new Error(`Invalid file type. Allowed: ${opts.allowedTypes.join(', ')}`);
      }

      // Validate file size
      const maxBytes = (opts.maxSizeMB || 10) * 1024 * 1024;
      if (file.size > maxBytes) {
        throw new Error(`File too large. Max: ${opts.maxSizeMB}MB`);
      }

      // Create immediate preview
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);
      setProgress(10);

      // Compress image client-side
      let uploadBlob: Blob;
      if (file.type.startsWith('image/') && file.size > 500 * 1024) {
        setProgress(20);
        uploadBlob = await compressImage(file);
        setProgress(40);
      } else {
        uploadBlob = file;
        setProgress(40);
      }

      // Generate unique filename
      const ext = file.name.split('.').pop() || 'jpg';
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const fileName = `${timestamp}-${randomStr}.${ext}`;
      const path = opts.folder ? `${opts.folder}/${fileName}` : fileName;

      setProgress(50);

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(opts.bucket || 'uploads')
        .upload(path, uploadBlob, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      setProgress(90);

      // Get signed URL for display
      const { data: urlData } = await supabase.storage
        .from(opts.bucket || 'uploads')
        .createSignedUrl(path, 3600);

      setProgress(100);

      return {
        path: data.path,
        url: urlData?.signedUrl || '',
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [compressImage]);

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  }, [previewUrl]);

  return {
    upload,
    isUploading,
    progress,
    error,
    previewUrl,
    reset,
  };
}