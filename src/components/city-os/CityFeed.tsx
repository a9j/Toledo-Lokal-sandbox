import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Radio, Megaphone, CalendarDays, Building2, TriangleAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useCityFeed, type FeedItem, type FeedScope } from '@/hooks/useCityChange';
import { eventTypeLabel, entityPath } from '@/integrations/supabase/city-os';

const SCOPES: { value: FeedScope; label: string; needsAccount: boolean }[] = [
  { value: 'city', label: 'City', needsAccount: false },
  { value: 'neighborhood', label: 'My area', needsAccount: true },
  { value: 'mile', label: 'One mile', needsAccount: true },
  { value: 'following', label: 'Following', needsAccount: true },
];

const SOURCE_ICON: Record<string, typeof Radio> = {
  change: Building2,
  event: CalendarDays,
  pulse: Radio,
  signal: Megaphone,
};

const SOURCE_LABEL: Record<string, string> = {
  change: 'Change',
  event: 'Event',
  pulse: 'Pulse',
  signal: 'Signal',
};

function whenLabel(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = then - Date.now();
  const days = Math.round(diff / 86_400_000);
  if (diff > 0) {
    if (days <= 0) return 'Later today';
    if (days === 1) return 'Tomorrow';
    if (days < 7) return `In ${days} days`;
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  const ago = Math.floor(-diff / 86_400_000);
  if (ago <= 0) return 'Today';
  if (ago === 1) return 'Yesterday';
  if (ago < 7) return `${ago} days ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function itemLink(item: FeedItem): string | null {
  if (item.source_table === 'events') return `/events/${item.source_id}`;
  if (item.source_table === 'pulse_posts') return `/pulse/${item.source_id}`;
  if (item.source_table && item.source_id) {
    return entityPath({ source_table: item.source_table, source_id: item.source_id });
  }
  return null;
}

function FeedRow({ item }: { item: FeedItem }) {
  const Icon = SOURCE_ICON[item.source] ?? Radio;
  const to = itemLink(item);

  const inner = (
    <div className="flex gap-3 rounded-xl border border-border/60 bg-card p-4">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary" className="text-[10px]">
            {SOURCE_LABEL[item.source] ?? item.source}
          </Badge>
          {item.kind && item.source === 'change' && (
            <Badge variant="outline" className="text-[10px]">
              {eventTypeLabel(item.kind)}
            </Badge>
          )}
          {item.neighborhood_name && (
            <span className="text-[11px] text-muted-foreground">{item.neighborhood_name}</span>
          )}
        </div>
        <p className="mt-1.5 text-sm font-semibold leading-snug">{item.title}</p>
        {item.body && (
          <p className="mt-0.5 line-clamp-2 text-sm leading-snug text-muted-foreground">
            {item.body}
          </p>
        )}
        <p className="mt-1.5 text-xs text-muted-foreground">
          {whenLabel(item.occurred_at)}
          {item.distance_miles !== null && ` · ${item.distance_miles} mi away`}
        </p>
      </div>
    </div>
  );

  return to ? (
    <Link to={to} className="block transition-opacity hover:opacity-90">
      {inner}
    </Link>
  ) : (
    inner
  );
}

/**
 * One feed over four sources that used to be four screens: the CityGraph
 * change log, upcoming events, live pulse posts and city signals.
 *
 * The scope toggle is the point. City is everything; the other three need an
 * account, and My area and One mile need a home address on top of that, so the
 * empty state says which one is missing rather than showing a blank list.
 */
export function CityFeed({ className }: { className?: string }) {
  const { user } = useAuth();
  const [scope, setScope] = useState<FeedScope>('city');
  const { data: items, isLoading, error } = useCityFeed(scope);

  return (
    <div className={className}>
      <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
        {SCOPES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setScope(s.value)}
            disabled={s.needsAccount && !user}
            className={
              'shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ' +
              (scope === s.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border/60 bg-card hover:bg-muted/40') +
              (s.needsAccount && !user ? ' opacity-40' : '')
            }
          >
            {s.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : error ? (
        <div className="flex gap-3 rounded-xl border border-border/60 bg-muted/40 p-4">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Could not load the feed. Check your connection and try again.
          </p>
        </div>
      ) : !items || items.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {scope === 'city' && 'Nothing in the city feed right now.'}
            {scope === 'neighborhood' && 'Nothing in your area yet.'}
            {scope === 'mile' && 'Nothing within a mile of you yet.'}
            {scope === 'following' && 'Nothing from what you follow yet.'}
          </p>
          {(scope === 'neighborhood' || scope === 'mile') && (
            <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted-foreground">
              This one needs your home address.{' '}
              <Link to="/my-city" className="font-medium text-primary">
                Set it in My City
              </Link>
              .
            </p>
          )}
          {scope === 'following' && (
            <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted-foreground">
              Follow a business, a place or a project and its changes land here.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <FeedRow key={`${item.source}-${item.item_id}`} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
