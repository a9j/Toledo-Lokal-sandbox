import { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Soft, rounded, lightly-shadowed card — the one card look used everywhere.
export function ProfileCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('rounded-2xl border border-border/60 bg-card p-4 shadow-sm', className)}>
      {children}
    </div>
  );
}

export function Chip({ icon: Icon, children, tone = 'default' }: { icon?: LucideIcon; children: ReactNode; tone?: 'default' | 'primary' | 'success' | 'amber' }) {
  const tones = {
    default: 'bg-secondary text-foreground/80',
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    amber: 'bg-lokal-amber/15 text-lokal-amber',
  } as const;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium', tones[tone])}>
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </span>
  );
}

export function SectionLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</h3>
      {action}
    </div>
  );
}

// Horizontal snap carousel for compact cards.
export function HScroll({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scrollbar-hide px-4 pb-1', className)}>
      {children}
    </div>
  );
}

// Compact, never-dead empty state: explains what will appear + an optional action.
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <ProfileCard className="flex items-start gap-3">
      {Icon && (
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-secondary">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </ProfileCard>
  );
}

// Small activity pill used for fallback "alive" signals.
export function ActivityPill({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-secondary/60 px-3 py-2 text-sm text-foreground/80">
      <Icon className="h-4 w-4 flex-shrink-0 text-primary" />
      <span className="truncate">{children}</span>
    </div>
  );
}
