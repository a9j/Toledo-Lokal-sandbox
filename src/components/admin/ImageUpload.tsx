import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { moderateContent } from '@/hooks/useContentModeration';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Loader2, AlertTriangle } from 'lucide-react';

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
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('uploads')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(fileName);

      // Moderate the image
      setModerating(true);
      const modResult = await moderateContent({ imageUrl: publicUrl });
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

      onUpload(publicUrl);
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
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploading || moderating}
        className="hidden"
        id="image-upload"
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
          htmlFor="image-upload"
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
        >
          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="text-xs text-muted-foreground mt-1">Max 5MB</span>
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
