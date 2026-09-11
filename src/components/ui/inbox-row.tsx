import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { imageSources } from '@/lib/entity-image';
import { Skeleton } from '@/components/ui/skeleton';

interface InboxRowProps {
  title: string;
  /** When it happened, already formatted. */
  time: string;
  unread?: boolean;
  imageUrl?: string | null;
  kind?: string | null;
  href?: string;
  /** One quiet line under the title. */
  detail?: string;
  className?: string;
}

/**
 * One line in the Civic Inbox.
 *
 * The unread dot sits on the right where the thumb already is, so marking
 * things read does not mean reaching across the screen.
 */
export function InboxRow({
  title,
  time,
  unread = false,
  imageUrl,
  kind,
  href,
  detail,
  className,
}: InboxRowProps) {
  const source = imageSources(imageUrl, kind);

  const body = (
    <div
      className={cn(
        'flex items-center gap-3 py-3 motion-safe:transition-colors',
        href && 'hover:bg-secondary/40',
        className,
      )}
    >
      <img
        src={source.src}
        alt=""
        aria-hidden
        className="h-11 w-11 shrink-0 rounded-xl object-cover"
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate text-sm text-foreground',
            unread ? 'font-semibold' : 'font-medium',
          )}
        >
          {title}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {detail ? `${detail} · ${time}` : time}
        </p>
      </div>
      {unread && (
        <span
          className="h-2 w-2 shrink-0 rounded-full bg-primary"
          aria-label="Unread"
        />
      )}
    </div>
  );

  return href ? <Link to={href} className="block">{body}</Link> : body;
}

export function InboxRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3">
      <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-1.5 h-3 w-1/3" />
      </div>
    </div>
  );
}
