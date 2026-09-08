import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, MapPin, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useCity } from '@/contexts/CityContext';
import { usePrivacy } from '@/hooks/usePrivacy';
import { useCitySearch, resultPath, kindLabel, type SearchResult } from '@/hooks/useCityOs';
import { FollowButton } from '@/components/city-os/FollowButton';

/** The order groups appear in. Anything not listed follows, alphabetically. */
const KIND_ORDER = [
  'business', 'event', 'deal', 'job', 'organization',
  'project', 'place', 'neighborhood', 'opportunity', 'resource', 'issue', 'property',
];

const EXAMPLES = [
  'cheap stuff for kids Saturday',
  'coffee near me',
  'who is hiring',
  'what is being built',
];

export default function CitySearch() {
  const navigate = useNavigate();
  const { city } = useCity();
  const { allows } = usePrivacy();
  const [query, setQuery] = useState('');
  const { data: results, isLoading, isFetching } = useCitySearch(query);

  const groups = useMemo(() => {
    const byKind = new Map<string, SearchResult[]>();
    for (const r of results ?? []) {
      const list = byKind.get(r.kind) ?? [];
      list.push(r);
      byKind.set(r.kind, list);
    }
    return Array.from(byKind.entries()).sort((a, b) => {
      const ai = KIND_ORDER.indexOf(a[0]);
      const bi = KIND_ORDER.indexOf(b[0]);
      if (ai === -1 && bi === -1) return a[0].localeCompare(b[0]);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [results]);

  const searching = query.trim().length >= 2;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <h1 className="font-heading text-2xl font-semibold tracking-tight">Ask {city.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        One box for everything: places, events, jobs, deals, projects and streets.
      </p>

      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${city.name}`}
          aria-label={`Search ${city.name}`}
          autoFocus
          className="pl-9"
        />
        {isFetching && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {!searching && (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Try
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setQuery(example)}
                className="rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
              >
                {example}
              </button>
            ))}
          </div>
          {!allows('share_location') && (
            <p className="mt-4 text-xs leading-snug text-muted-foreground">
              Turn on "Use where I am" in{' '}
              <Link to="/privacy" className="font-medium text-primary">Privacy</Link>{' '}
              and results closer to you will come first.
            </p>
          )}
        </div>
      )}

      {searching && isLoading && (
        <div className="mt-5 space-y-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      )}

      {searching && !isLoading && groups.length === 0 && (
        <div className="py-14 text-center">
          <p className="text-sm font-medium">Nothing matched that</p>
          <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted-foreground">
            Try fewer words, or a name you know is in {city.name}.
          </p>
        </div>
      )}

      {searching && groups.length > 0 && (
        <div className="mt-5 space-y-6">
          {groups.map(([kind, rows]) => (
            <section key={kind}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {kindLabel(kind)}
              </h2>
              <div className="space-y-2">
                {rows.map((row) => (
                  <div
                    key={row.entity_id}
                    className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <Link to={resultPath(row)} className="text-sm font-semibold hover:underline">
                        {row.name}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {row.neighborhood && (
                          <Badge variant="outline" className="text-[10px]">
                            <MapPin className="mr-1 h-2.5 w-2.5" />
                            {row.neighborhood}
                          </Badge>
                        )}
                        {row.distance_miles !== null && (
                          <span className="text-xs text-muted-foreground">
                            {row.distance_miles} mi away
                          </span>
                        )}
                      </div>
                    </div>
                    <FollowButton
                      source={{ table: row.source_table, id: row.source_id }}
                      size="sm"
                      className="shrink-0"
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
