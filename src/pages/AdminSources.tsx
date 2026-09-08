import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Play, Loader2, TriangleAlert, Rss, CalendarDays, Database, Map, FileSpreadsheet, PenLine } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useDataSources, useSourceRecordCounts, useRunConnector, statusLabel, type DataSourceKind } from '@/hooks/useDataSources';

const KIND_ICON: Record<DataSourceKind, typeof Rss> = {
  rss: Rss,
  ical: CalendarDays,
  api: Database,
  gis: Map,
  csv: FileSpreadsheet,
  manual: PenLine,
};

/** Green only when a run actually worked. Everything else reads as needing
 *  attention, because it does. */
function statusTone(status: string | null): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'ok') return 'default';
  if (status === 'failed' || status === 'bad url') return 'destructive';
  return 'secondary';
}

function when(iso: string | null): string {
  if (!iso) return 'never';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'never';
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export default function AdminSources() {
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { data: sources, isLoading, error } = useDataSources();
  const { data: counts } = useSourceRecordCounts();
  const run = useRunConnector();
  const [running, setRunning] = useState<string | null>(null);

  if (authLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-heading text-lg font-semibold">Admins only</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          This page lists where the city data comes from.
        </p>
        <Button variant="secondary" className="mt-5" onClick={() => navigate('/')}>
          Go home
        </Button>
      </div>
    );
  }

  const runNow = (id: string, name: string) => {
    setRunning(id);
    run.mutate(id, {
      onSuccess: (result) => {
        if (result?.error) toast.error(result.error);
        else if (result?.ok) toast.success(`${name}: ${result.records ?? 0} records.`);
        else toast.warning(result?.message ?? `${name}: ${statusLabel(result?.status ?? null)}.`);
      },
      onError: (e: Error) => toast.error(e.message || 'That run could not start.'),
      onSettled: () => setRunning(null),
    });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 pt-6">
      <button
        onClick={() => navigate('/admin')}
        className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Admin
      </button>

      <h1 className="font-heading text-2xl font-semibold tracking-tight">Data sources</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Where the city data comes from, when it last came in, and whether it worked.
      </p>

      <div className="mt-4 flex gap-3 rounded-xl border border-border/60 bg-muted/40 p-4">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-sm leading-snug text-muted-foreground">
          Almost everything in the app right now is sandbox data that somebody made up
          for testing. It is marked that way on every screen. Real sources go here.
        </p>
      </div>

      {isLoading ? (
        <div className="mt-5 space-y-3">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      ) : error ? (
        <p className="mt-5 text-sm text-muted-foreground">
          Could not load the sources. Check your connection and try again.
        </p>
      ) : !sources || sources.length === 0 ? (
        <p className="mt-5 text-sm text-muted-foreground">No sources yet.</p>
      ) : (
        <div className="mt-5 space-y-3">
          {sources.map((source) => {
            const Icon = KIND_ICON[source.kind] ?? Database;
            const busy = running === source.id;
            const canRun = source.kind === 'ical' || source.kind === 'rss';
            return (
              <div key={source.id} className="rounded-xl border border-border/60 bg-card p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{source.name}</p>
                      <Badge variant={statusTone(source.last_status)} className="text-[10px]">
                        {statusLabel(source.last_status)}
                      </Badge>
                      {!source.is_active && (
                        <Badge variant="outline" className="text-[10px]">Off</Badge>
                      )}
                    </div>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {source.kind.toUpperCase()} · last run {when(source.last_run_at)} ·{' '}
                      {counts?.[source.id] ?? 0} records held
                      {source.schedule ? ` · wants to run ${source.schedule}` : null}
                    </p>

                    {source.url ? (
                      <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">
                        {source.url}
                      </p>
                    ) : source.kind !== 'manual' ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        No link set yet, so there is nothing to pull.
                      </p>
                    ) : null}

                    {source.last_error && (
                      <p className="mt-1.5 text-xs leading-snug text-destructive">
                        {source.last_error}
                      </p>
                    )}
                  </div>

                  {canRun && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy || run.isPending}
                      onClick={() => runNow(source.id, source.name)}
                    >
                      {busy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <Play className="mr-1.5 h-3.5 w-3.5" />
                          Run now
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-xs leading-snug text-muted-foreground">
        A run saves what it finds without publishing it. Turning a fetched record into a
        live event or a post is a separate step that somebody has to decide on.
      </p>
    </div>
  );
}
