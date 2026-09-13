import { Link } from 'react-router-dom';
import {
  Sparkles,
  CalendarDays,
  Tag,
  Briefcase,
  HeartHandshake,
  Users,
  Truck,
  HardHat,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LP_ENABLED, SOFT_LAUNCH } from '@/lib/flags';

interface Destination {
  path: string;
  icon: LucideIcon;
  label: string;
  blurb: string;
  show?: boolean;
}

/**
 * The rest of the app, in one place.
 *
 * Phase 0 Step 9 cut the tab bar down to five and left Featured, Community and
 * Circles with routes but no way in: the pages still worked, nothing linked to
 * them, and Featured was not even routed. A phone cannot carry eight tabs, so
 * the destinations live here instead, on the tab people already open to look
 * around.
 *
 * Anything gated by a flag is filtered out rather than rendered as a dead end.
 */
const DESTINATIONS: Destination[] = [
  { path: '/featured', icon: Sparkles, label: 'Featured', blurb: 'The picks, carousels and what is on now' },
  { path: '/events', icon: CalendarDays, label: 'Events', blurb: 'Everything on over the next ten weeks' },
  { path: '/deals', icon: Tag, label: 'Deals', blurb: 'Offers you can use this week' },
  { path: '/jobs', icon: Briefcase, label: 'Jobs', blurb: 'Open positions at Toledo businesses' },
  { path: '/community', icon: HeartHandshake, label: 'Community', blurb: 'Nonprofits and community organisations' },
  { path: '/circles', icon: Users, label: 'Circles', blurb: 'The Charter 100 and what it is shaping' },
  { path: '/food-today', icon: Truck, label: 'Food trucks', blurb: 'Where the trucks are serving today', show: !SOFT_LAUNCH },
  { path: '/built', icon: HardHat, label: 'Being built', blurb: 'Developments and what is changing' },
  { path: '/loop', icon: Sparkles, label: 'Loop', blurb: 'Points, rewards and missions', show: LP_ENABLED },
];

export function MoreInToledo({ className }: { className?: string }) {
  const items = DESTINATIONS.filter((d) => d.show !== false);

  return (
    <section className={cn('space-y-3', className)}>
      <h2 className="text-sm font-medium text-muted-foreground">More in Toledo</h2>
      <ul className="grid grid-cols-2 gap-2 lg:grid-cols-3">
        {items.map(({ path, icon: Icon, label, blurb }) => (
          <li key={path}>
            <Link
              to={path}
              className={cn(
                'flex h-full items-start gap-3 rounded-xl border border-border/60 bg-card p-3',
                'transition-colors hover:border-primary/30 hover:bg-primary/5',
              )}
            >
              <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">{label}</span>
                <span className="block text-xs leading-snug text-muted-foreground">{blurb}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
