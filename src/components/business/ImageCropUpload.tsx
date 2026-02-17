import { useState, useCallback, useRef } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, X, ZoomIn, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageCropUploadProps {
  aspectRatio: number;
  shape: 'circle' | 'rectangle';
  maxFileSize: number; // MB
  outputWidth: number;
  outputHeight: number;
  onUploadComplete: (url: string) => void;
  placeholder?: string;
  currentImageUrl?: string | null;
  className?: string;
}

function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  outputWidth: number,
  outputHeight: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        outputWidth,
        outputHeight
      );
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas toBlob failed'));
        },
        'image/webp',
        0.85
      );
    };
    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = imageSrc;
  });
}

export function ImageCropUpload({
  aspectRatio,
  shape,
  maxFileSize,
  outputWidth,
  outputHeight,
  onUploadComplete,
  placeholder = 'Click or drop to upload',
  currentImageUrl,
  className,
}: ImageCropUploadProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFileSelected = useCallback(
    (file: File) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a JPG, PNG, or WebP image');
        return;
      }
      if (file.size > maxFileSize * 1024 * 1024) {
        toast.error(`File too large. Max: ${maxFileSize}MB`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setShowCropper(true);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      };
      reader.readAsDataURL(file);
    },
    [maxFileSize]
  );

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleConfirmCrop = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setIsUploading(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels, outputWidth, outputHeight);
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const fileName = `${timestamp}-${randomStr}.webp`;
      const path = `businesses/${fileName}`;

      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(path, blob, { contentType: 'image/webp', upsert: false });

      if (error) throw error;

      const { data: urlData } = await supabase.storage
        .from('uploads')
        .createSignedUrl(path, 3600);

      setPreview(urlData?.signedUrl || null);
      onUploadComplete(data.path);
      setShowCropper(false);
      setImageSrc(null);
      toast.success('Image uploaded!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [imageSrc, croppedAreaPixels, outputWidth, outputHeight, onUploadComplete]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) onFileSelected(file);
    },
    [onFileSelected]
  );

  const handleRemove = () => {
    setPreview(null);
    onUploadComplete('');
  };

  return (
    <>
      <div
        className={cn(
          'relative border-2 border-dashed border-border rounded-2xl transition-colors hover:border-primary/50 cursor-pointer overflow-hidden',
          shape === 'circle' ? 'aspect-square max-w-[200px] rounded-full' : 'aspect-[3/1]',
          className
        )}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {preview ? (
          <>
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 p-4 text-center">
            <Upload className="h-6 w-6 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{placeholder}</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileSelected(file);
            e.target.value = '';
          }}
        />
      </div>

      <Dialog open={showCropper} onOpenChange={setShowCropper}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>Crop Image</DialogTitle>
          </DialogHeader>
          <div className="relative h-[350px] bg-muted">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatio}
                cropShape={shape === 'circle' ? 'round' : 'rect'}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>
          <div className="px-6 py-3 flex items-center gap-3">
            <ZoomIn className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={([v]) => setZoom(v)}
              className="flex-1"
            />
          </div>
          <div className="flex justify-end gap-2 p-4 pt-0">
            <Button variant="outline" onClick={() => setShowCropper(false)} disabled={isUploading}>
              Cancel
            </Button>
            <Button onClick={handleConfirmCrop} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Confirm & Upload'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
