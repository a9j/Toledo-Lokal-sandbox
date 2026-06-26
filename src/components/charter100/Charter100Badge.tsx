import { cn } from '@/lib/utils';

// Permanent, platform-wide identity badge for Charter 100 members. Distinct in
// look and vocabulary from business "Founding" tiers — this is a resident's
// founding charter, rendered anywhere a profile appears.
interface Charter100BadgeProps {
  // 'chip' for author rows / inline; 'full' for profile headers.
  variant?: 'chip' | 'full';
  className?: string;
}

export function Charter100Badge({ variant = 'chip', className }: Charter100BadgeProps) {
  if (variant === 'full') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border border-lokal-gold/40 bg-lokal-gold/10 px-3 py-1 text-xs font-semibold text-lokal-gold',
          className,
        )}
      >
        <span aria-hidden="true">★</span>
        Charter 100
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-lokal-gold/15 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-lokal-gold',
        className,
      )}
      title="Charter 100 — founding resident"
    >
      <span aria-hidden="true">★</span>
      Charter 100
    </span>
  );
}
