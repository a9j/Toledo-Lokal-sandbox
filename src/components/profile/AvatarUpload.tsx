import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { generateSignedUrl } from '@/hooks/useSignedUrl';
import { SecureAvatar } from '@/components/ui/secure-avatar';

interface AvatarUploadProps {
  currentUrl?: string | null;
  userName?: string;
  userEmail?: string;
  userId: string;
  onUploadComplete: (url: string) => void;
}

export function AvatarUpload({ 
  currentUrl, 
  userName, 
  userEmail,
  userId,
  onUploadComplete 
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get signed URL for the uploaded file
      const signedUrl = await generateSignedUrl(fileName);
      
      if (!signedUrl) {
        throw new Error('Failed to generate signed URL');
      }

      // Update profile with the file path (not the full URL)
      // This allows signed URLs to be regenerated later
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: fileName })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // Pass the signed URL back for immediate display
      onUploadComplete(signedUrl);
      toast.success('Profile photo updated!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const fallbackChar = userName?.charAt(0)?.toUpperCase() || 
                       userEmail?.charAt(0)?.toUpperCase() || 
                       '?';

  return (
    <div className="relative group">
      <SecureAvatar 
        storagePath={currentUrl}
        fallbackText={fallbackChar}
        className="h-20 w-20"
      />
      
      <Button
        size="icon"
        variant="secondary"
        className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
