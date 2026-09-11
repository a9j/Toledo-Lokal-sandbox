import { cn } from '@/lib/utils';
import { imageSources } from '@/lib/entity-image';
import { Skeleton } from '@/components/ui/skeleton';

interface HeroImageProps {
  /** Whatever image URL the caller already has. Null falls back to the kind tile. */
  url?: string | null;
  /** Entity kind, which picks the fallback tile. */
  kind?: string | null;
  title: string;
  /** Small line above the title: a kind pill, a neighborhood, a date. */
  eyebrow?: React.ReactNode;
  /** 4:3 on detail pages, 16:9 on list cards. */
  ratio?: '4/3' | '16/9';
  loading?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * The picture at the top of a detail page, with the title sitting on it.
 *
 * The gradient is doing real work: it is what keeps white text readable over a
 * photograph nobody has seen yet, whether that photograph turns out to be a
 * bright sky or a dark room. It also fades into the page background so the
 * image belongs to the page rather than sitting in a box on it.
 */
export function HeroImage({
  url,
  kind,
  title,
  eyebrow,
  ratio = '4/3',
  loading = false,
  className,
  children,
}: HeroImageProps) {
  const source = imageSources(url, kind);

  if (loading) {
    return (
      <Skeleton
        className={cn('w-full rounded-none', ratio === '4/3' ? 'aspect-[4/3]' : 'aspect-video', className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden',
        ratio === '4/3' ? 'aspect-[4/3]' : 'aspect-video',
        className,
      )}
    >
      <img
        src={source.src}
        alt={source.isPlaceholder ? '' : title}
        aria-hidden={source.isPlaceholder || undefined}
        className="absolute inset-0 h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-700"
        loading="eager"
      />

      {/* Order matters here, and getting it wrong is invisible in dark mode.
          The page coloured fade has to sit UNDER the dark scrim. Painted over
          it, the fade washes white across exactly the band where the title
          sits, and the title disappears in light mode while looking perfect in
          dark. The scrim goes on top so white text is legible in both themes,
          and the fade is kept short so the bottom edge still eases into the
          page rather than stopping dead. */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-5">
        {eyebrow && <div className="mb-2 flex flex-wrap items-center gap-2">{eyebrow}</div>}
        <h1 className="font-heading text-2xl font-semibold leading-tight tracking-tight text-white drop-shadow-sm">
          {title}
        </h1>
        {children && <div className="mt-3">{children}</div>}
      </div>
    </div>
  );
}
