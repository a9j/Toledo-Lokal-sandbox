import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TierBadgeProps {
  tier: 'founding_5' | 'founding_50' | 'community' | 'growth' | 'pro';
  size?: 'sm' | 'md' | 'lg';
  visible?: boolean;
  className?: string;
}

const tierConfig = {
  founding_5: {
    label: 'Founding 5',
    gradient: 'from-amber-500 to-yellow-400',
    textColor: 'text-amber-950',
    border: 'border-amber-400/50',
    bg: 'bg-gradient-to-r from-amber-500 to-yellow-400',
    shieldColor: 'text-amber-950',
  },
  founding_50: {
    label: 'Founding 50',
    gradient: 'from-slate-400 to-slate-300',
    textColor: 'text-slate-900',
    border: 'border-slate-300/50',
    bg: 'bg-gradient-to-r from-slate-400 to-slate-300',
    shieldColor: 'text-slate-900',
  },
  pro: {
    label: 'Pro',
    gradient: 'from-indigo-500 to-violet-500',
    textColor: 'text-white',
    border: 'border-indigo-400/50',
    bg: 'bg-gradient-to-r from-indigo-500 to-violet-500',
    shieldColor: 'text-white',
  },
  growth: {
    label: '',
    gradient: '',
    textColor: '',
    border: '',
    bg: '',
    shieldColor: '',
  },
  community: {
    label: '',
    gradient: '',
    textColor: '',
    border: '',
    bg: '',
    shieldColor: '',
  },
};

const sizeConfig = {
  sm: {
    badge: 'px-2 py-0.5 text-[10px] gap-1',
    icon: 'h-3 w-3',
  },
  md: {
    badge: 'px-3 py-1 text-xs gap-1.5',
    icon: 'h-3.5 w-3.5',
  },
  lg: {
    badge: 'px-4 py-1.5 text-sm gap-2',
    icon: 'h-4 w-4',
  },
};

export function TierBadge({ tier, size = 'md', visible = true, className }: TierBadgeProps) {
  if (tier === 'community' || tier === 'growth' || !visible) return null;

  const config = tierConfig[tier];
  const sizeStyle = sizeConfig[size];

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full border',
        config.bg,
        config.textColor,
        config.border,
        sizeStyle.badge,
        className
      )}
    >
      <Shield className={cn(sizeStyle.icon, config.shieldColor, 'fill-current')} />
      {config.label}
    </span>
  );
}

export function TierLabel({ tier, assignedAt }: { tier: string; assignedAt?: string | null }) {
  if (tier === 'community' || tier === 'growth') return null;

  const year = assignedAt ? new Date(assignedAt).getFullYear() : new Date().getFullYear();

  if (tier === 'founding_5') {
    return (
      <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
        Founding 5, Est. {year}
      </p>
    );
  }

  if (tier === 'founding_50') {
    return (
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        Founding 50 Member, Est. {year}
      </p>
    );
  }

  if (tier === 'pro') {
    return (
      <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
        Pro Partner
      </p>
    );
  }

  return null;
}
