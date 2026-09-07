import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { HardHat, List, Map as MapIcon, ChevronRight, TriangleAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { SEOHead } from '@/components/seo/SEOHead';
import { MapCanvas } from '@/components/maps/MapCanvas';
import { useGoogleMapsKey } from '@/hooks/useGoogleMapsKey';
import {
  useDevelopmentRadar,
  developmentStatusLabel,
  DEVELOPMENT_STATUSES,
  DEVELOPMENT_KINDS,
  type RadarRow,
} from '@/hooks/useCityChange';

const TOLEDO_CENTER = { lat: 41.6528, lng: -83.5379 };

const MAP_STYLE = { width: '100%', height: '100%' };

// One colour per status so the map reads at a glance. Being built is the one
// people look for, so it gets the strongest colour.
const STATUS_COLOR: Record<string, string> = {
  proposed: '#94a3b8',
  under_review: '#0ea5e9',
  approved: '#6366f1',
  under_construction: '#f59e0b',
  completed: '#16a34a',
  stalled: '#a16207',
  cancelled: '#dc2626',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className="border-transparent text-[10px] text-white"
      style={{ backgroundColor: STATUS_COLOR[status] ?? '#64748b' }}
    >
      {developmentStatusLabel(status)}
    </Badge>
  );
}

function money(amount: number | null): string | null {
  if (amount === null || amount === undefined) return null;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${Math.round(amount / 1_000)}k`;
  return `$${amount}`;
}

function DevelopmentRow({ row }: { row: RadarRow }) {
  return (
    <Link
      to={`/built/${row.id}`}
      className="block rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-border hover:bg-muted/40"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={row.status} />
            {row.kind && (
              <Badge variant="secondary" className="text-[10px] capitalize">
                {row.kind.replace(/_/g, ' ')}
              </Badge>
            )}
            {row.neighborhood_name && (
              <span className="text-[11px] text-muted-foreground">{row.neighborhood_name}</span>
            )}
          </div>
          <p className="mt-1.5 text-sm font-semibold leading-snug">{row.name}</p>
          {row.summary && (
            <p className="mt-0.5 line-clamp-2 text-sm leading-snug text-muted-foreground">
              {row.summary}
            </p>
          )}
          <p className="mt-1.5 text-xs text-muted-foreground">
            {[
              row.developer,
              money(row.investment_amount),
              row.est_completion
                ? `due ${new Date(row.est_completion).toLocaleDateString(undefined, {
                    month: 'short',
                    year: 'numeric',
                  })}`
                : null,
              row.distance_miles !== null ? `${row.distance_miles} mi away` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      </div>
    </Link>
  );
}

function RadarMap({ rows }: { rows: RadarRow[] }) {
  const { apiKey, isLoading, error } = useGoogleMapsKey();
  const [open, setOpen] = useState<RadarRow | null>(null);

  const pins = useMemo(
    () => rows.filter((r) => r.latitude !== null && r.longitude !== null),
    [rows],
  );

  // Centre on the first pin so the map opens where the filtered results are,
  // and fall back to the middle of Toledo when nothing has a point.
  const first = pins[0];
  const center =
    first && first.latitude !== null && first.longitude !== null
      ? { lat: first.latitude, lng: first.longitude }
      : TOLEDO_CENTER;

  const fallback = (message: string) => (
    <div className="flex h-full items-center justify-center rounded-xl border border-border/60 bg-muted/40 p-6 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );

  if (isLoading) return <Skeleton className="h-full w-full rounded-xl" />;
  if (!apiKey) return fallback(error ?? 'The map needs a key that is not set here. The list still works.');

  return (
    <MapCanvas
      apiKey={apiKey}
      loadingFallback={<Skeleton className="h-full w-full rounded-xl" />}
      errorFallback={fallback('The map could not load. The list still works.')}
    >
      <GoogleMap
        mapContainerStyle={MAP_STYLE}
        center={center}
        zoom={11}
        options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
      >
        {pins.map((row) => (
          <Marker
            key={row.id}
            position={{ lat: row.latitude as number, lng: row.longitude as number }}
            onClick={() => setOpen(row)}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: STATUS_COLOR[row.status] ?? '#64748b',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }}
          />
        ))}
        {open && open.latitude !== null && open.longitude !== null && (
          <InfoWindow
            position={{ lat: open.latitude, lng: open.longitude }}
            onCloseClick={() => setOpen(null)}
          >
            <div className="max-w-[15rem] p-1">
              <p className="text-sm font-semibold">{open.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {developmentStatusLabel(open.status)}
                {open.address ? ` · ${open.address}` : ''}
              </p>
              <Link to={`/built/${open.id}`} className="mt-1.5 block text-xs font-medium text-primary">
                Open
              </Link>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </MapCanvas>
  );
}

/**
 * Development Radar: what is being built, proposed or stalled across the city.
 *
 * The map and the list read the same function, so they can never disagree
 * about what is on the radar.
 */
export default function Developments() {
  const [view, setView] = useState<'list' | 'map'>('list');
  const [statuses, setStatuses] = useState<string[]>([]);
  const [kinds, setKinds] = useState<string[]>([]);

  const { data: rows, isLoading, error } = useDevelopmentRadar({ statuses, kinds });

  const toggle = (list: string[], value: string, set: (v: string[]) => void) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  return (
    <>
      <SEOHead
        title="What is being built | ToledoLokal"
        description="Every project proposed, approved, under construction or on hold across Toledo, on one map."
      />
      <Header title="What is being built" showBack />
      <PageContainer>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              What is being built
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {rows ? `${rows.length} projects` : 'Projects'} across Toledo. Follow one and its
              changes land in your inbox.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setView((v) => (v === 'list' ? 'map' : 'list'))}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border/60 bg-card px-3 py-2 text-xs font-medium"
          >
            {view === 'list' ? (
              <>
                <MapIcon className="h-3.5 w-3.5" /> Map
              </>
            ) : (
              <>
                <List className="h-3.5 w-3.5" /> List
              </>
            )}
          </button>
        </div>

        <div className="-mx-1 mb-2 flex gap-2 overflow-x-auto px-1 pb-1">
          {DEVELOPMENT_STATUSES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => toggle(statuses, s.value, setStatuses)}
              className={
                'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ' +
                (statuses.includes(s.value)
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border/60 bg-card hover:bg-muted/40')
              }
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1">
          {DEVELOPMENT_KINDS.map((k) => (
            <button
              key={k.value}
              type="button"
              onClick={() => toggle(kinds, k.value, setKinds)}
              className={
                'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ' +
                (kinds.includes(k.value)
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border/60 bg-card hover:bg-muted/40')
              }
            >
              {k.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        ) : error ? (
          <div className="flex gap-3 rounded-xl border border-border/60 bg-muted/40 p-4">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Could not load the radar. Check your connection and try again.
            </p>
          </div>
        ) : !rows || rows.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <HardHat className="h-6 w-6 text-muted-foreground" />
            </div>
            <h2 className="font-heading text-lg font-semibold">Nothing matches those filters</h2>
            <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted-foreground">
              Clear one and try again.
            </p>
          </div>
        ) : view === 'map' ? (
          <div className="h-[26rem] overflow-hidden rounded-xl border border-border/60">
            <RadarMap rows={rows} />
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <DevelopmentRow key={row.id} row={row} />
            ))}
          </div>
        )}

        <p className="mt-6 text-xs leading-snug text-muted-foreground">
          Sandbox data. These projects are made up for testing and do not describe anything real.
        </p>
      </PageContainer>
    </>
  );
}
