import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePulse } from '@/hooks/usePulse';
import { PulsePostCard } from './PulsePostCard';
import { NeighborhoodEnergy } from './NeighborhoodEnergy';
import { PulseCategoryFilter } from './PulseCategoryFilter';
import { PulseEmptyState } from './PulseEmptyState';
import { PulseIcon } from './PulseIcon';
import { PULSE_TABS, PulseTab, PULSE_EVENT_TEMPLATE_KEYS } from '@/lib/pulse-config';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Followed businesses = the user's saved businesses (the "Following" tab source).
function useFollowedBusinessIds() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['pulse-following-ids', user?.id],
    queryFn: async () => {
      if (!user) return [] as string[];
      const { data } = await supabase
        .from('saved_items')
        .select('item_id')
        .eq('user_id', user.id)
        .eq('item_type', 'business');
      return (data || []).map((r) => r.item_id);
    },
    enabled: !!user,
  });
}

function useHomeNeighborhood() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['pulse-home-neighborhood', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('neighborhood_id, neighborhoods(name)')
        .eq('user_id', user.id)
        .maybeSingle();
      const hood = (data as { neighborhoods?: { name?: string } | null } | null)?.neighborhoods;
      return hood?.name ?? null;
    },
    enabled: !!user,
  });
}

interface PulseFeedProps {
  limit?: number;
  // When false, hides the tab bar, neighborhood-energy row, and category
  // chips — useful when the feed is embedded as a small section elsewhere.
  showFilters?: boolean;
}

export function PulseFeed({ limit, showFilters = true }: PulseFeedProps = {}) {
  const [tab, setTab] = useState<PulseTab>('for_you');
  const [neighborhood, setNeighborhood] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);

  const { data: followedIds = [] } = useFollowedBusinessIds();
  const { data: homeNeighborhood } = useHomeNeighborhood();

  const effectiveNeighborhood = neighborhood ?? (tab === 'nearby' ? homeNeighborhood ?? undefined : undefined);

  const pulseOptions = useMemo(() => {
    const base = {
      neighborhood: effectiveNeighborhood || undefined,
      tag: category || undefined,
      limit,
    } as Parameters<typeof usePulse>[0];

    if (!showFilters) return base;

    switch (tab) {
      case 'trending':
        return { ...base, sort: 'trending' as const };
      case 'community':
        return { ...base, contentType: 'community_activity' as const };
      case 'events':
        return { ...base, templateKeys: PULSE_EVENT_TEMPLATE_KEYS };
      case 'live':
        return { ...base, contentType: 'city_signal' as const };
      case 'following':
        return { ...base, businessIds: followedIds.length ? followedIds : ['__none__'] };
      default:
        return base;
    }
  }, [tab, effectiveNeighborhood, category, followedIds, limit, showFilters]);

  const { data: posts, isLoading, error } = usePulse(pulseOptions);

  return (
    <div className="space-y-4">
      {showFilters && (
        <>
          {/* Tabs */}
          <div className="-mx-1 flex gap-1.5 overflow-x-auto scrollbar-hide px-1 pb-1">
            {PULSE_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all',
                  tab === t.id
                    ? 'bg-foreground text-background'
                    : 'bg-secondary/60 text-muted-foreground hover:bg-secondary'
                )}
              >
                <PulseIcon name={t.icon} className="h-3.5 w-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          {/* City-energy layer */}
          <NeighborhoodEnergy selected={neighborhood} onSelect={setNeighborhood} />

          {/* Category filter */}
          <PulseCategoryFilter selected={category} onSelect={setCategory} />
        </>
      )}

      {/* Feed */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <div className="py-12 text-center text-muted-foreground space-y-3">
          <p>Couldn't load Pulse right now.</p>
          <p className="text-xs">{(error as Error).message}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      ) : posts && posts.length > 0 ? (
        <div className="space-y-3">
          {posts.map((post) => (
            <PulsePostCard key={post.id} post={post} />
          ))}
        </div>
      ) : showFilters ? (
        (neighborhood || category) ? (
          <div className="py-12 text-center text-muted-foreground space-y-2">
            <p className="text-sm font-medium">No posts match these filters</p>
            <p className="text-xs">Try a different neighborhood or category, or clear your filters.</p>
          </div>
        ) : (
          <PulseEmptyState />
        )
      ) : null}
    </div>
  );
}
