import { useState } from 'react';
import { Image, X } from 'lucide-react';
import { FlipCard } from '../FlipCard';
import { SecureImage } from '@/components/ui/secure-image';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface MediaCardProps {
  photos?: string[] | null;
  businessName: string;
}

export function MediaCard({ photos, businessName }: MediaCardProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Skip the first photo since it's used as the hero/backdrop image
  const galleryPhotos = photos?.slice(1) || [];
  const hasPhotos = galleryPhotos.length > 0;

  return (
    <>
      <FlipCard title="Photos">
        <div className="flex flex-col h-full">
          {hasPhotos ? (
            <div className="grid grid-cols-2 gap-2 flex-1">
              {galleryPhotos.slice(0, 6).map((photo, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedPhoto(photo)}
                  className={`
                    relative overflow-hidden rounded-2xl bg-muted
                    ${index === 0 ? 'col-span-2 aspect-video' : 'aspect-square'}
                    hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                  `}
                >
                  <SecureImage
                    storagePath={photo}
                    alt={`${businessName} photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
              
              {galleryPhotos.length > 6 && (
                <div className="aspect-square rounded-2xl bg-muted/50 flex items-center justify-center">
                  <span className="text-lg font-semibold text-muted-foreground">
                    +{galleryPhotos.length - 6} more
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Image className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">No Photos Yet</h3>
              <p className="text-sm text-muted-foreground">
                Photos will appear here soon
              </p>
            </div>
          )}
        </div>
      </FlipCard>

      {/* Fullscreen Photo Viewer */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black/95 border-none">
          <div className="relative w-full h-[80vh]">
            {selectedPhoto && (
              <SecureImage
                storagePath={selectedPhoto}
                alt={businessName}
                className="w-full h-full object-contain"
              />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20"
              onClick={() => setSelectedPhoto(null)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
