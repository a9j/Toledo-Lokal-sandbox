import { Image } from 'lucide-react';
import { SecureImage } from '@/components/ui/secure-image';
import { CollapsibleSection } from './CollapsibleSection';

interface PhotosSectionProps {
  photos?: string[] | null;
  businessName: string;
}

export function PhotosSection({ photos, businessName }: PhotosSectionProps) {
  if (!photos || photos.length === 0) return null;

  return (
    <CollapsibleSection title="Photos" icon={Image}>
      <div className="grid grid-cols-3 gap-2">
        {photos.slice(0, 6).map((photo, index) => (
          <div
            key={index}
            className="aspect-square rounded-xl overflow-hidden bg-secondary"
          >
            <SecureImage
              storagePath={photo}
              alt={`${businessName} photo ${index + 1}`}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        ))}
      </div>
      {photos.length > 6 && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          +{photos.length - 6} more photos
        </p>
      )}
    </CollapsibleSection>
  );
}
