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

// Include HEIC/HEIF in allowed types - we'll convert them automatically
const DEFAULT_OPTIONS: UploadOptions = {
  bucket: 'uploads',
  folder: '',
  maxSizeMB: 10,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'],
};

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const compressImage = useCallback(async (file: File, maxWidth: number = 1920, quality: number = 0.85): Promise<File> => {
    // Animated GIFs are never touched: drawing one to a canvas would flatten
    // it to a single static frame.
    if (file.type === 'image/gif') return file;

    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
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

        // Keep the source format for PNG/WebP so transparency survives;
        // photographs (and HEIC conversions) become JPEG. The returned File
        // carries the matching type and extension so the stored contentType
        // always describes the actual bytes.
        const targetType =
          file.type === 'image/png' ? 'image/png'
          : file.type === 'image/webp' ? 'image/webp'
          : 'image/jpeg';
        const targetExt =
          targetType === 'image/png' ? 'png'
          : targetType === 'image/webp' ? 'webp'
          : 'jpg';

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const name = file.name.replace(/\.[^.]+$/, `.${targetExt}`);
              resolve(new File([blob], name, { type: targetType }));
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          targetType,
          quality
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image'));
      };
      img.src = objectUrl;
    });
  }, []);

  const convertHeicToJpeg = useCallback(async (file: File): Promise<File> => {
    try {
      const { default: heic2any } = await import('heic2any');
      const convertedBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.9,
      });
      
      // heic2any can return an array of blobs for multi-page HEIC, we take the first
      const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      if (!blob) {
        throw new Error('HEIC conversion produced no image data.');
      }
      
      // Create a new File object with .jpg extension
      const newFileName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
      return new File([blob], newFileName, { type: 'image/jpeg' });
    } catch (err) {
      console.error('HEIC conversion failed:', err);
      throw new Error('Failed to convert HEIC image. Please try a JPG or PNG file.');
    }
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
      let processedFile = file;
      
      // Check if HEIC/HEIF and convert to JPEG
      const isHeic = file.type === 'image/heic' || 
                     file.type === 'image/heif' || 
                     file.name.toLowerCase().endsWith('.heic') ||
                     file.name.toLowerCase().endsWith('.heif');
      
      if (isHeic) {
        setProgress(5);
        toast.info('Converting HEIC to JPEG...');
        processedFile = await convertHeicToJpeg(file);
        setProgress(15);
      }

      // Validate file type (after potential conversion)
      const allowedTypes = [...(opts.allowedTypes || [])];
      if (!allowedTypes.includes(processedFile.type) && !isHeic) {
        throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
      }

      // Validate file size
      const maxBytes = (opts.maxSizeMB || 10) * 1024 * 1024;
      if (processedFile.size > maxBytes) {
        throw new Error(`File too large. Max: ${opts.maxSizeMB}MB`);
      }

      // Create immediate preview
      const localPreview = URL.createObjectURL(processedFile);
      setPreviewUrl(localPreview);
      setProgress(20);

      // Compress image client-side (GIFs pass through untouched so
      // animation survives; the returned File always matches its bytes)
      let uploadFile: File;
      if (processedFile.type.startsWith('image/') && processedFile.size > 500 * 1024) {
        setProgress(30);
        uploadFile = await compressImage(processedFile);
        setProgress(50);
      } else {
        uploadFile = processedFile;
        setProgress(50);
      }

      // Generate unique filename with the correct extension
      const ext = uploadFile.name.split('.').pop() || 'jpg';
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const fileName = `${timestamp}-${randomStr}.${ext}`;
      const path = opts.folder ? `${opts.folder}/${fileName}` : fileName;

      setProgress(60);

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(opts.bucket || 'uploads')
        .upload(path, uploadFile, {
          contentType: uploadFile.type,
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      setProgress(95);

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
  }, [compressImage, convertHeicToJpeg]);

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