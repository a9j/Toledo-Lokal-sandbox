import { ReactNode } from 'react';
import './hire-local.css';
import type { RecordItemStatus } from './types';

// Wrapper that applies the scoped Hire Local design tokens and paper
// background. Everything in the feature renders inside this.
export function HireShell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`hl-scope ${className}`}>{children}</div>;
}

export function HireContainer({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`mx-auto w-full max-w-md px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-5 ${className}`}
    >
      {children}
    </div>
  );
}

export function Display({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`hl-display ${className}`}>{children}</span>;
}

// Initials avatar. No photos by spec; initials are enough and leak nothing.
export function InitialsAvatar({ name, size = 44 }: { name: string | null; size?: number }) {
  const initials = (name ?? '?')
    .split(' ')
    .map((p) => p.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        background: 'var(--hl-green-tint)',
        color: 'var(--hl-green-deep)',
        fontSize: size * 0.36,
      }}
      className="hl-display inline-flex shrink-0 items-center justify-center rounded-full font-semibold"
    >
      {initials || '?'}
    </span>
  );
}

// The legend dots. Amber = organization-verified. Gray = self-reported.
export function Dot({ tone }: { tone: 'verified' | 'pending' }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-2.5 w-2.5 rounded-full"
      style={{ background: tone === 'verified' ? 'var(--hl-amber)' : 'var(--hl-gray)' }}
    />
  );
}

export function LegendBar() {
  return (
    <div
      className="flex items-center gap-4 rounded-2xl border px-4 py-3 text-[13px]"
      style={{ background: 'var(--hl-card)', borderColor: 'var(--hl-line)', color: 'var(--hl-soft)' }}
    >
      <span className="flex items-center gap-2">
        <Dot tone="verified" />
        Verified by an organization
      </span>
      <span className="flex items-center gap-2">
        <Dot tone="pending" />
        Self-reported
      </span>
    </div>
  );
}

// The one place boldness is spent: the amber verified mark. Pending is quiet
// gray, denied is a muted outline. These three never blur into one another.
export function StateBadge({ status }: { status: RecordItemStatus }) {
  const map: Record<RecordItemStatus, { label: string; bg: string; fg: string; border: string }> = {
    verified: { label: 'Verified', bg: 'var(--hl-amber-tint)', fg: 'var(--hl-amber)', border: 'var(--hl-amber)' },
    pending: { label: 'Pending', bg: 'var(--hl-gray-tint)', fg: 'var(--hl-gray)', border: 'transparent' },
    denied: { label: 'Self-reported', bg: 'transparent', fg: 'var(--hl-faint)', border: 'var(--hl-line)' },
  };
  const s = map[status];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: s.bg, color: s.fg, border: `1px solid ${s.border}` }}
    >
      {status === 'verified' && <Dot tone="verified" />}
      {s.label}
    </span>
  );
}

export function HireCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[20px] border ${className}`}
      style={{ background: 'var(--hl-card)', borderColor: 'var(--hl-line)' }}
    >
      {children}
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-2 mt-6 text-[13px] font-semibold uppercase tracking-wide" style={{ color: 'var(--hl-faint)' }}>
      {children}
    </h2>
  );
}

// A real empty state that invites action, never mood.
export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div
      className="rounded-[20px] border border-dashed px-5 py-8 text-center"
      style={{ borderColor: 'var(--hl-line)', color: 'var(--hl-soft)' }}
    >
      <p className="hl-display text-[15px]" style={{ color: 'var(--hl-ink)' }}>
        {title}
      </p>
      {hint && <p className="mt-1 text-[13px]">{hint}</p>}
    </div>
  );
}

export function HireButton({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  disabled,
  className = '',
  ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--hl-green)', color: '#fff', border: '1px solid var(--hl-green)' },
    secondary: { background: 'var(--hl-card)', color: 'var(--hl-green-deep)', border: '1px solid var(--hl-line)' },
    ghost: { background: 'transparent', color: 'var(--hl-soft)', border: '1px solid transparent' },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-opacity disabled:opacity-50 ${className}`}
      style={styles[variant]}
    >
      {children}
    </button>
  );
}
