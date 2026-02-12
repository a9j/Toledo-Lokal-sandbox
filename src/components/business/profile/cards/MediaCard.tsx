import { useState, useEffect } from 'react';
import { Image, X, Heart, MessageCircle } from 'lucide-react';
import { FlipCard } from '../FlipCard';
import { SecureImage, prefetchSignedUrls } from '@/components/ui/secure-image';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface MediaCardProps {
  photos?: string[] | null;
  businessName: string;
}

export function MediaCard({ photos, businessName }: MediaCardProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  // Skip the first photo since it's used as the hero/backdrop image
  const galleryPhotos = photos?.slice(1) || [];
  const hasPhotos = galleryPhotos.length > 0;

  // Prefetch gallery images for instant loading
  useEffect(() => {
    if (galleryPhotos.length > 0) {
      prefetchSignedUrls(galleryPhotos.slice(0, 9)); // Prefetch visible grid
    }
  }, [galleryPhotos]);

  const handlePhotoClick = (photo: string, index: number) => {
    setSelectedPhoto(photo);
    setSelectedIndex(index);
  };

  const navigatePhoto = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'next' 
      ? (selectedIndex + 1) % galleryPhotos.length
      : (selectedIndex - 1 + galleryPhotos.length) % galleryPhotos.length;
    setSelectedIndex(newIndex);
    setSelectedPhoto(galleryPhotos[newIndex]);
  };

  return (
    <>
      <FlipCard title="Photos">
        <div className="flex flex-col h-full -mx-1">
          {hasPhotos ? (
            <>
              {/* Instagram-style 3-column grid */}
              <div className="grid grid-cols-3 gap-0.5">
                {galleryPhotos.slice(0, 9).map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => handlePhotoClick(photo, index)}
                    className="group relative aspect-square overflow-hidden bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
                  >
                    <SecureImage
                      storagePath={photo}
                      alt={`${businessName} photo ${index + 1}`}
                      className="w-full h-full"
                      imgClassName="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {/* Instagram-style hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex items-center gap-4 text-white">
                        <span className="flex items-center gap-1.5 font-semibold text-sm">
                          <Heart className="h-5 w-5 fill-white" />
                        </span>
                        <span className="flex items-center gap-1.5 font-semibold text-sm">
                          <MessageCircle className="h-5 w-5 fill-white" />
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              {/* More photos indicator */}
              {galleryPhotos.length > 9 && (
                <button 
                  onClick={() => handlePhotoClick(galleryPhotos[9], 9)}
                  className="mt-2 py-2 text-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  View all {galleryPhotos.length} photos
                </button>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center mb-4">
                <Image className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">No Posts Yet</h3>
              <p className="text-sm text-muted-foreground">
                When photos are shared, they'll appear here
              </p>
            </div>
          )}
        </div>
      </FlipCard>

      {/* Instagram-style Lightbox */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-3xl p-0 bg-black border-none overflow-hidden">
          <div className="relative w-full aspect-square max-h-[85vh]">
            {selectedPhoto && (
              <SecureImage
                storagePath={selectedPhoto}
                alt={businessName}
                className="w-full h-full"
                imgClassName="object-contain"
              />
            )}
            
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 text-white hover:bg-white/20 z-10"
              onClick={() => setSelectedPhoto(null)}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Navigation arrows */}
            {galleryPhotos.length > 1 && (
              <>
                <button
                  onClick={() => navigatePhoto('prev')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-colors"
                >
                  <svg className="h-4 w-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => navigatePhoto('next')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-colors"
                >
                  <svg className="h-4 w-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Photo counter dots */}
            {galleryPhotos.length > 1 && galleryPhotos.length <= 9 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                {galleryPhotos.slice(0, 9).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handlePhotoClick(galleryPhotos[index], index)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      index === selectedIndex 
                        ? 'bg-white w-2' 
                        : 'bg-white/50 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Photo counter text for many photos */}
            {galleryPhotos.length > 9 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 text-white text-sm font-medium">
                {selectedIndex + 1} / {galleryPhotos.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
