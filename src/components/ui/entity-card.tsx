import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { imageSources } from '@/lib/entity-image';
import { FollowButton } from '@/components/city-os/FollowButton';
import type { EntitySourceTable } from '@/integrations/supabase/city-os';

interface EntityCardProps {
  name: string;
  /** Entity kind, which sets the pill and the fallback tile. */
  kind: string;
  kindLabel?: string;
  /** One line: a distance, a time, a deal, a neighborhood. Not a paragraph. */
  context?: string | null;
  imageUrl?: string | null;
  href: string;
  /** Pass the source row and the card grows a follow button. */
  follow?: { table: EntitySourceTable; id: string } | null;
  className?: string;
}

/**
 * The card used for every kind of thing, everywhere a list of things appears.
 *
 * Photo on top at 16:9, then the kind, the name, and one line of why this is
 * on your screen. The follow button sits outside the link rather than inside
 * it: a button nested in an anchor is invalid markup, and tapping follow
 * would navigate instead.
 */
export function EntityCard({
  name,
  kind,
  kindLabel,
  context,
  imageUrl,
  href,
  follow,
  className,
}: EntityCardProps) {
  const source = imageSources(imageUrl, kind);

  return (
    <div
      className={cn(
        'group overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm',
        'motion-safe:transition-transform motion-safe:duration-200 motion-safe:active:scale-[0.98]',
        className,
      )}
    >
      <Link to={href} className="block">
        <div className="relative aspect-video overflow-hidden">
          <img
            src={source.src}
            alt={source.isPlaceholder ? '' : name}
            aria-hidden={source.isPlaceholder || undefined}
            loading="lazy"
            className="h-full w-full object-cover"
          />
          <Badge
            variant="secondary"
            className="absolute left-2 top-2 bg-background/85 text-[10px] font-medium backdrop-blur-sm"
          >
            {kindLabel ?? kind}
          </Badge>
        </div>

        <div className="p-3">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
            {name}
          </h3>
          {context && (
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{context}</p>
          )}
        </div>
      </Link>

      {follow && (
        <div className="px-3 pb-3">
          <FollowButton source={follow} size="sm" variant="outline" className="w-full" />
        </div>
      )}
    </div>
  );
}

export function EntityCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-2xl border border-border/60 bg-card', className)}>
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="p-3">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="mt-2 h-3 w-1/2" />
      </div>
    </div>
  );
}
