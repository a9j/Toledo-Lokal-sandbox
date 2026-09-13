import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { SecureImage } from '@/components/ui/secure-image';
import { useEntityMedia } from '@/hooks/useEntityMedia';

interface EntityPhotosProps {
  entityId?: string | null;
  /** Small line above the strip. Omitted when there is nothing to show. */
  title?: string;
  className?: string;
}

/**
 * The photo strip on a detail page.
 *
 * Swipeable rather than a grid, because on a phone a grid of three pictures is
 * either too small to read or pushes everything below it off the screen. The
 * strip scrolls past the page gutter on purpose: the cut off fourth picture is
 * what tells somebody there is more to swipe.
 *
 * Renders nothing at all when an entity has no pictures. An empty heading over
 * an empty row reads as broken, and plenty of entities will never have photos.
 */
export function EntityPhotos({ entityId, title = 'Photos', className }: EntityPhotosProps) {
  const { data, isLoading } = useEntityMedia(entityId);

  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        <Skeleton className="h-4 w-20" />
        <div className="flex gap-3">
          <Skeleton className="h-28 w-44 shrink-0 rounded-xl" />
          <Skeleton className="h-28 w-44 shrink-0 rounded-xl" />
        </div>
      </div>
    );
  }

  const photos = data?.gallery ?? [];
  if (photos.length === 0) return null;

  return (
    <section className={cn('space-y-2', className)}>
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
        {photos.map((photo) => (
          <figure
            key={photo.id}
            className="relative h-28 w-44 shrink-0 snap-start overflow-hidden rounded-xl border border-border/60 bg-muted"
          >
            {photo.needsSigning ? (
              <SecureImage
                storagePath={photo.src}
                alt={photo.alt ?? ''}
                className="h-full w-full"
                imgClassName="h-full w-full object-cover"
              />
            ) : (
              <img
                src={photo.src}
                alt={photo.alt ?? ''}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            )}
          </figure>
        ))}
      </div>
    </section>
  );
}
