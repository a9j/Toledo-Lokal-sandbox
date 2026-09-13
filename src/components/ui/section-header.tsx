import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  /** One quiet line under the title. Optional, and usually better left off. */
  subtitle?: string;
  /** Where "See all" goes. Omit it and no link is shown. */
  seeAllHref?: string;
  seeAllLabel?: string;
  className?: string;
}

/**
 * The same heading everywhere, so the eye learns the rhythm of the page.
 *
 * Spacing lives here rather than at each call site, which is the whole point:
 * one place decides how much air a section gets.
 */
export function SectionHeader({
  title,
  subtitle,
  seeAllHref,
  seeAllLabel = 'See all',
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('mb-3 flex items-end justify-between gap-3 px-1', className)}>
      <div className="min-w-0">
        <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        {subtitle && <p className="mt-0.5 truncate text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {seeAllHref && (
        <Link
          to={seeAllHref}
          className="flex shrink-0 items-center gap-0.5 text-sm font-medium text-primary hover:underline"
        >
          {seeAllLabel}
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
