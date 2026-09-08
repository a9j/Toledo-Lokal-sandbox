import { Link } from 'react-router-dom';
import { Radar, LogIn, MoonStar, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { SEOHead } from '@/components/seo/SEOHead';
import { useAuth } from '@/contexts/AuthContext';
import { useMyHome } from '@/hooks/useMyCity';
import { entityPath, eventTypeLabel } from '@/integrations/supabase/city-os';
import {
  useAutopilotDigest,
  useAutopilotPreferences,
  useAutopilotTopics,
  useSaveAutopilotPreferences,
  type DigestItem,
} from '@/hooks/usePlatform';

const RADII = [0.5, 1, 2, 5];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function hourLabel(hour: number): string {
  if (hour === 0) return 'midnight';
  if (hour === 12) return 'noon';
  return hour < 12 ? `${hour} am` : `${hour - 12} pm`;
}

function DigestRow({ item }: { item: DigestItem }) {
  const to =
    item.source_table && item.source_id
      ? entityPath({ source_table: item.source_table, source_id: item.source_id })
      : null;

  const card = (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="secondary" className="text-[10px]">
          {item.reason}
        </Badge>
        <Badge variant="outline" className="text-[10px]">
          {eventTypeLabel(item.event_type)}
        </Badge>
        {item.distance_miles !== null && (
          <span className="text-[11px] text-muted-foreground">{item.distance_miles} mi</span>
        )}
      </div>
      <p className="mt-1.5 text-sm font-semibold leading-snug">{item.title}</p>
      {item.body && (
        <p className="mt-0.5 line-clamp-2 text-sm leading-snug text-muted-foreground">
          {item.body}
        </p>
      )}
    </div>
  );

  return to ? (
    <Link to={to} className="block transition-opacity hover:opacity-90">
      {card}
    </Link>
  ) : (
    card
  );
}

/**
 * City Autopilot.
 *
 * The page shows exactly what would be sent and why, because a digest that
 * cannot be inspected is a digest nobody trusts. Nothing is actually pushed
 * yet: there is no scheduler and no notification channel in this environment,
 * and the page says so rather than implying otherwise.
 */
export default function Autopilot() {
  const { user } = useAuth();
  const { data: home } = useMyHome();
  const { data: prefs, isLoading: prefsLoading } = useAutopilotPreferences();
  const { data: topics } = useAutopilotTopics();
  const { data: digest, isLoading, error } = useAutopilotDigest(5, 14);
  const save = useSaveAutopilotPreferences();

  if (!user) {
    return (
      <>
        <Header title="Autopilot" showBack />
        <PageContainer>
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <Radar className="h-6 w-6 text-muted-foreground" />
            </div>
            <h1 className="font-heading text-lg font-semibold">Sign in to set up Autopilot</h1>
            <Button asChild className="mt-5">
              <Link to="/auth">
                <LogIn className="mr-1.5 h-4 w-4" />
                Sign in
              </Link>
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  const selected = prefs?.topics ?? [];
  const patch = (p: Record<string, unknown>) =>
    save.mutate(p, { onError: () => toast.error('Could not save that.') });

  const toggleTopic = (topic: string) =>
    patch({
      topics: selected.includes(topic) ? selected.filter((t) => t !== topic) : [...selected, topic],
    });

  return (
    <>
      <SEOHead
        title="Autopilot | ToledoLokal"
        description="Pick what you want to hear about and Autopilot keeps an eye on the city for you."
      />
      <Header title="Autopilot" showBack />
      <PageContainer>
        <div className="mb-5">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Autopilot</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tell it what matters and it watches the city for you. Everything you follow counts
            first.
          </p>
        </div>

        <div className="mb-5 flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4">
          <div className="flex-1">
            <p className="text-sm font-semibold">Autopilot is {prefs?.digest_enabled === false ? 'off' : 'on'}</p>
            <p className="text-xs text-muted-foreground">
              Turn it off and this page goes quiet.
            </p>
          </div>
          <Switch
            checked={prefs?.digest_enabled !== false}
            onCheckedChange={(v) => patch({ digest_enabled: v })}
            aria-label="Autopilot on"
          />
        </div>

        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold">What do you want to hear about</h2>
          <p className="mb-2.5 text-xs text-muted-foreground">
            Pick none and you get everything near you.
          </p>
          <div className="flex flex-wrap gap-2">
            {(topics ?? []).map((t) => (
              <button
                key={t.topic}
                type="button"
                onClick={() => toggleTopic(t.topic)}
                className={
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ' +
                  (selected.includes(t.topic)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/60 bg-card hover:bg-muted/40')
                }
              >
                {t.label}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold">How far counts as near</h2>
          {!home && (
            <p className="mb-2.5 text-xs text-muted-foreground">
              Distance needs your address.{' '}
              <Link to="/my-city" className="font-medium text-primary">
                Set it in My City
              </Link>
              .
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {RADII.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => patch({ radius_miles: r })}
                className={
                  'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ' +
                  (Number(prefs?.radius_miles ?? 2) === r
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/60 bg-card hover:bg-muted/40')
                }
              >
                {r < 1 ? 'Half a mile' : `${r} mile${r > 1 ? 's' : ''}`}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-6">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <MoonStar className="h-4 w-4 text-muted-foreground" />
            Quiet hours
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">From</span>
            <select
              value={prefs?.quiet_from ?? 21}
              onChange={(e) => patch({ quiet_from: Number(e.target.value) })}
              className="rounded-lg border border-border/60 bg-card px-2 py-1.5 text-sm"
              aria-label="Quiet hours start"
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {hourLabel(h)}
                </option>
              ))}
            </select>
            <span className="text-muted-foreground">until</span>
            <select
              value={prefs?.quiet_until ?? 8}
              onChange={(e) => patch({ quiet_until: Number(e.target.value) })}
              className="rounded-lg border border-border/60 bg-card px-2 py-1.5 text-sm"
              aria-label="Quiet hours end"
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {hourLabel(h)}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold">What it would send you now</h2>
          {prefsLoading || isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          ) : error ? (
            <div className="flex gap-3 rounded-xl border border-border/60 bg-muted/40 p-4">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Could not load the digest. Check your connection and try again.
              </p>
            </div>
          ) : !digest || digest.length === 0 ? (
            <p className="rounded-xl border border-border/60 bg-muted/40 p-4 text-sm text-muted-foreground">
              {prefs?.digest_enabled === false
                ? 'Autopilot is off.'
                : 'Nothing yet. Follow a place or set your address and it will have something to work with.'}
            </p>
          ) : (
            <div className="space-y-3">
              {digest.map((item) => (
                <DigestRow key={item.log_id} item={item} />
              ))}
            </div>
          )}
        </section>

        <p className="mt-6 text-xs leading-snug text-muted-foreground">
          Nothing is pushed to you yet. This environment has no scheduler and no notification
          channel, so Autopilot only shows you what it would send when you open this page.
        </p>
      </PageContainer>
    </>
  );
}
