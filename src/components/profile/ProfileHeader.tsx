import { BadgeCheck, MapPin, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SecureImage } from '@/components/ui/secure-image';
import { placeholderFor } from '@/lib/entity-image';
import { cn } from '@/lib/utils';

interface ProfileHeaderProps {
  name: string;
  /** Storage path for the cover. Falls back to the neighborhood tile. */
  coverPath?: string | null;
  avatarPath?: string | null;
  neighborhood?: string | null;
  /** When they joined, already formatted as a month and year. */
  since?: string | null;
  /** Only true once an address has actually been verified. */
  verified?: boolean;
  /** Shows the edit affordances. Only on your own profile. */
  editable?: boolean;
  onEditCover?: () => void;
  onEditAvatar?: () => void;
  loading?: boolean;
  className?: string;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * The top of a person's page.
 *
 * A cover with the avatar hanging over its bottom edge, which is the shape
 * people already read as "this is someone", rather than a settings header with
 * a name in it. The cover defaults to the tile for their neighborhood, so a
 * profile with no uploads still looks like a place rather than a blank band.
 *
 * The verified badge appears only when an address has actually been verified.
 * A badge that shows up for everyone means nothing.
 */
export function ProfileHeader({
  name,
  coverPath,
  avatarPath,
  neighborhood,
  since,
  verified = false,
  editable = false,
  onEditCover,
  onEditAvatar,
  loading = false,
  className,
}: ProfileHeaderProps) {
  if (loading) {
    return (
      <div className={className}>
        <Skeleton className="aspect-[3/1] w-full rounded-none" />
        <div className="px-4">
          <Skeleton className="-mt-10 h-20 w-20 rounded-2xl" />
          <Skeleton className="mt-3 h-6 w-40" />
          <Skeleton className="mt-2 h-4 w-28" />
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="relative aspect-[3/1] w-full overflow-hidden bg-muted">
        {coverPath ? (
          <SecureImage
            storagePath={coverPath}
            alt=""
            priority
            className="absolute inset-0 h-full w-full"
            imgClassName="h-full w-full object-cover"
            fallback={
              <img src={placeholderFor('neighborhood')} alt="" aria-hidden
                   className="absolute inset-0 h-full w-full object-cover" />
            }
          />
        ) : (
          <img src={placeholderFor('neighborhood')} alt="" aria-hidden
               className="absolute inset-0 h-full w-full object-cover" />
        )}

        {editable && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={onEditCover}
            className="absolute right-3 top-3 bg-background/85 backdrop-blur-sm"
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Cover
          </Button>
        )}
      </div>

      <div className="px-4">
        <div className="relative -mt-10 inline-block">
          <div className="h-20 w-20 overflow-hidden rounded-2xl border-4 border-background bg-secondary">
            {avatarPath ? (
              <SecureImage
                storagePath={avatarPath}
                alt={name}
                className="h-full w-full"
                imgClassName="h-full w-full object-cover"
                fallback={
                  <div className="flex h-full w-full items-center justify-center font-heading text-xl font-semibold text-muted-foreground">
                    {initials(name)}
                  </div>
                }
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-heading text-xl font-semibold text-muted-foreground">
                {initials(name)}
              </div>
            )}
          </div>

          {editable && (
            <button
              type="button"
              onClick={onEditAvatar}
              aria-label="Change your picture"
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{name}</h1>
          {verified && (
            <Badge variant="secondary" className="gap-1">
              <BadgeCheck className="h-3.5 w-3.5 text-primary" />
              Lokal ID
            </Badge>
          )}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {neighborhood && (
            <Badge variant="outline" className="gap-1 font-normal">
              <MapPin className="h-3 w-3" />
              {neighborhood}
            </Badge>
          )}
          {since && <span className="text-sm text-muted-foreground">Lokal since {since}</span>}
        </div>
      </div>
    </div>
  );
}

interface ProgressRingProps {
  value: number;
  total: number;
  label: string;
  sublabel?: string;
  className?: string;
}

/**
 * Passport progress, as a ring rather than a bar.
 *
 * A ring reads as a collection filling up, which is what a passport is. The
 * number in the middle is the thing being counted, not a percentage, because
 * "34 of 60" is more useful than "57 percent".
 */
export function ProgressRing({ value, total, label, sublabel, className }: ProgressRingProps) {
  const safeTotal = total > 0 ? total : 1;
  const fraction = Math.max(0, Math.min(1, value / safeTotal));
  const radius = 34;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div className="relative h-20 w-20 shrink-0">
        <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
          <circle cx="40" cy="40" r={radius} fill="none" strokeWidth="7"
                  className="stroke-muted" />
          <circle
            cx="40" cy="40" r={radius} fill="none" strokeWidth="7" strokeLinecap="round"
            className="stroke-primary motion-safe:transition-[stroke-dashoffset] motion-safe:duration-700"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - fraction)}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-heading text-lg font-semibold">{value}</span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {value} of {total}
        </p>
        {sublabel && <p className="mt-0.5 text-xs text-muted-foreground">{sublabel}</p>}
      </div>
    </div>
  );
}
