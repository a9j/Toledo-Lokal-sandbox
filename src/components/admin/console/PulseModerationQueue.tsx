import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Radio, ShieldCheck, Lock } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { usePulseReportQueue, useResolvePulseReport } from '@/hooks/usePulseReports';
import { PULSE_REPORT_REASONS } from '@/lib/pulse-config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const REASON_LABELS = Object.fromEntries(PULSE_REPORT_REASONS.map((r) => [r.id, r.label]));

export function PulseModerationQueue() {
  const { can } = usePermissions();
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const { data: reports, isLoading } = usePulseReportQueue(filter);
  const resolve = useResolvePulseReport();

  if (!can('moderate')) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
        <Lock className="h-4 w-4" /> You don't have moderation access.
      </div>
    );
  }

  const handle = async (reportId: string, postId: string, action: 'dismiss' | 'remove') => {
    try {
      await resolve.mutateAsync({ reportId, postId, action, note: notes[reportId]?.trim() });
      toast.success(action === 'remove' ? 'Post removed' : 'Report dismissed');
    } catch {
      toast.error('Action failed. Check your permissions.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Radio className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Pulse reports</h3>
      </div>

      <div className="flex gap-1.5">
        {(['pending', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm font-medium capitalize transition-colors',
              filter === f ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-secondary'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : !reports || reports.length === 0 ? (
        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium">Pulse queue is clear</p>
            <p className="text-xs text-muted-foreground">No {filter === 'all' ? '' : 'pending '}Pulse reports right now.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {reports.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border/60 bg-card p-3 shadow-sm">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-foreground/80">
                  {REASON_LABELS[r.reason] ?? r.reason}
                </span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[11px] font-medium capitalize',
                    r.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-secondary text-muted-foreground'
                  )}
                >
                  {r.status}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                </span>
              </div>

              {r.post ? (
                <p className="mt-1.5 text-sm text-foreground">
                  &ldquo;{r.post.content}&rdquo;
                  <span className="ml-1 text-xs text-muted-foreground">
                    · {r.post.content_type?.replace('_', ' ')}
                    {r.post.neighborhood ? ` · ${r.post.neighborhood}` : ''}
                    {r.post.status !== 'active' ? ` · ${r.post.status}` : ''}
                  </span>
                </p>
              ) : (
                <p className="mt-1.5 text-sm text-muted-foreground">Post no longer available.</p>
              )}

              {r.note && <p className="mt-0.5 text-xs text-muted-foreground">Reporter note: {r.note}</p>}

              {r.status === 'pending' && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Input
                    value={notes[r.id] ?? ''}
                    onChange={(e) => setNotes((p) => ({ ...p, [r.id]: e.target.value }))}
                    placeholder="Moderator note (optional)…"
                    className="h-8 flex-1 text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-full text-xs"
                    disabled={resolve.isPending}
                    onClick={() => handle(r.id, r.post_id, 'dismiss')}
                  >
                    Dismiss
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 rounded-full text-xs"
                    disabled={resolve.isPending}
                    onClick={() => handle(r.id, r.post_id, 'remove')}
                  >
                    Remove post
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
