import { useState, useRef, useId } from 'react';
import heic2any from 'heic2any';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { moderateContent } from '@/hooks/useContentModeration';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Loader2, AlertTriangle } from 'lucide-react';
import { generateSignedUrl } from '@/hooks/useSignedUrl';

interface ImageUploadProps {
  currentUrl?: string;
  onUpload: (url: string) => void;
  onRemove?: () => void;
  folder?: string;
  label?: string;
  className?: string;
}

export function ImageUpload({ 
  currentUrl, 
  onUpload, 
  onRemove,
  folder = 'admin',
  label = 'Upload Image',
  className = ''
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [moderating, setModerating] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      // Some devices (notably iPhone) may provide HEIC/HEIF photos which aren't reliably previewable
      // or processable by downstream services. Convert to JPEG when needed.
      let workingFile: File = file;
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      const isHeic =
        ext === 'heic' ||
        ext === 'heif' ||
        file.type === 'image/heic' ||
        file.type === 'image/heif';

      if (isHeic) {
        try {
          const converted = (await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.9,
          })) as Blob;

          workingFile = new File([
            converted,
          ], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' });
        } catch (convertErr) {
          throw new Error('This photo format (HEIC) could not be processed. Please try a JPG or PNG.');
        }
      }

      // Validate file type
      if (!workingFile.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      // Validate file size (max 10MB)
      if (workingFile.size > 10 * 1024 * 1024) {
        throw new Error('Image must be less than 10MB');
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(workingFile);

      // Upload to Storage
      const fileExt = (workingFile.name.split('.').pop() || 'jpg').toLowerCase();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, workingFile, { contentType: workingFile.type, upsert: false });

      if (uploadError) throw uploadError;

      // Get signed URL for the uploaded file
      const signedUrl = await generateSignedUrl(fileName);
      
      if (!signedUrl) {
        throw new Error('Failed to generate signed URL');
      }

      // Moderate the image using signed URL with timeout
      setModerating(true);
      
      // Set a client-side timeout for moderation
      const moderationPromise = moderateContent({ imageUrl: signedUrl });
      const timeoutPromise = new Promise<{ safe: boolean; flaggedReasons: string[] }>((resolve) => {
        setTimeout(() => {
          console.log('Moderation timeout - allowing upload');
          resolve({ safe: true, flaggedReasons: [] });
        }, 20000); // 20 second timeout
      });

      const modResult = await Promise.race([moderationPromise, timeoutPromise]);
      setModerating(false);

      if (!modResult.safe) {
        // Delete the uploaded file
        await supabase.storage.from('uploads').remove([fileName]);
        setPreview(null);
        setError(`Image rejected: ${modResult.flaggedReasons.join(', ')}`);
        toast({
          variant: 'destructive',
          title: 'Image Rejected',
          description: modResult.flaggedReasons.join(', '),
        });
        return;
      }

      // Store the file path (not the signed URL) for persistence
      // The signed URL will be regenerated when displaying the image
      onUpload(fileName);
      toast({ title: 'Image uploaded successfully' });

    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload image');
      setPreview(null);
    } finally {
      setUploading(false);
      setModerating(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
    onRemove?.();
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        onChange={handleFileSelect}
        disabled={uploading || moderating}
        className="hidden"
        id={inputId}
      />
      
      {preview ? (
        <div className="relative rounded-lg overflow-hidden border border-border">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full h-40 object-cover"
          />
          {(uploading || moderating) && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2 text-sm">
                {moderating ? 'Checking content...' : 'Uploading...'}
              </span>
            </div>
          )}
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={handleRemove}
            disabled={uploading || moderating}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label 
          htmlFor={inputId}
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
        >
          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="text-xs text-muted-foreground mt-1">Max 10MB</span>
        </label>
      )}

      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}
