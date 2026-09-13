import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  /** Or supply your own illustration instead of an icon. */
  illustration?: React.ReactNode;
  title: string;
  /** One line. If it needs two, the screen is explaining too much. */
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

/**
 * What a list says when it has nothing in it.
 *
 * A blank area reads as a bug. This says what is missing and offers the one
 * thing that would fill it, which is usually more useful than an apology.
 */
export function EmptyState({
  icon: Icon,
  illustration,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  const action = actionLabel
    ? actionHref
      ? <Button asChild className="mt-5"><Link to={actionHref}>{actionLabel}</Link></Button>
      : <Button className="mt-5" onClick={onAction}>{actionLabel}</Button>
    : null;

  return (
    <div className={cn('py-14 text-center', className)}>
      {illustration ?? (
        Icon && (
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <Icon className="h-6 w-6 text-muted-foreground" />
          </div>
        )
      )}
      <h3 className="font-heading text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
