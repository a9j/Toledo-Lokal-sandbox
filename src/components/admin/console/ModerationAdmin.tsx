import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { ShieldCheck, Flag, Lock, MessageSquarePlus, ChevronDown, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type ReportStatus = 'open' | 'reviewing' | 'escalated' | 'resolved' | 'dismissed';
type FilterStatus = ReportStatus | 'all';

interface Report {
  id: string;
  target_type: string;
  target_id: string | null;
  target_label: string | null;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
}
interface ModAction {
  id: string;
  report_id: string | null;
  action: string;
  note: string | null;
  created_at: string;
}

const FILTERS: { id: FilterStatus; label: string }[] = [
  { id: 'open', label: 'Open' },
  { id: 'reviewing', label: 'Reviewing' },
  { id: 'escalated', label: 'Escalated' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'dismissed', label: 'Dismissed' },
  { id: 'all', label: 'All' },
];

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-amber-100 text-amber-700',
  reviewing: 'bg-blue-100 text-blue-700',
  escalated: 'bg-red-100 text-red-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  dismissed: 'bg-secondary text-muted-foreground',
};

const TARGET_LABELS: Record<string, string> = {
  pulse_post: 'Pulse post', business: 'Business', review: 'Review', comment: 'Comment',
  photo: 'Photo', user: 'User', event: 'Event',
};

export function ModerationAdmin() {
  const { user } = useAuth();
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterStatus>('open');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const { data: reports, isLoading } = useQuery({
    queryKey: ['moderation-reports', filter],
    queryFn: async () => {
      let q = supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(50);
      if (filter !== 'all') q = q.eq('status', filter);
      const { data, error } = await q;
      if (error) throw error;
      return data as Report[];
    },
    enabled: can('moderate'),
  });

  const reportIds = (reports ?? []).map((r) => r.id);
  const { data: actions } = useQuery({
    queryKey: ['moderation-actions', reportIds],
    queryFn: async () => {
      if (reportIds.length === 0) return [] as ModAction[];
      const { data, error } = await supabase
        .from('moderation_actions')
        .select('*')
        .in('report_id', reportIds)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ModAction[];
    },
    enabled: can('moderate') && reportIds.length > 0,
  });

  const act = useMutation({
    mutationFn: async ({ report, action, status, note }: { report: Report; action: string; status?: ReportStatus; note?: string }) => {
      if (status) {
        const patch: { status: ReportStatus; resolved_by?: string | null; resolved_at?: string; resolution?: string } = { status };
        if (status === 'resolved' || status === 'dismissed') {
          patch.resolved_by = user?.id ?? null;
          patch.resolved_at = new Date().toISOString();
          if (note) patch.resolution = note;
        }
        const { error } = await supabase.from('reports').update(patch).eq('id', report.id);
        if (error) throw error;
      }
      const { error: aErr } = await supabase
        .from('moderation_actions')
        .insert({ report_id: report.id, moderator_user_id: user?.id ?? null, action, note: note ?? null });
      if (aErr) throw aErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-reports'] });
      queryClient.invalidateQueries({ queryKey: ['moderation-actions'] });
      toast.success('Updated');
    },
    onError: () => toast.error('Action failed. Check your permissions.'),
  });

  if (!can('moderate')) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
        <Lock className="h-4 w-4" /> You don't have moderation access.
      </div>
    );
  }

  const targetLink = (r: Report) => {
    if (!r.target_id) return null;
    if (r.target_type === 'business') return `/business/${r.target_id}`;
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              filter === f.id ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-secondary'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
      ) : !reports || reports.length === 0 ? (
        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100"><ShieldCheck className="h-4 w-4 text-emerald-600" /></div>
          <div>
            <p className="text-sm font-medium">Queue is clear</p>
            <p className="text-xs text-muted-foreground">No {filter === 'all' ? '' : filter} reports right now. Nice work.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {reports.map((r) => {
            const link = targetLink(r);
            const history = (actions ?? []).filter((a) => a.report_id === r.id);
            const isOpen = expanded === r.id;
            return (
              <div key={r.id} className="rounded-2xl border border-border/60 bg-card p-3 shadow-sm">
                <div className="flex items-start gap-2">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-secondary"><Flag className="h-4 w-4 text-muted-foreground" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-foreground/80">{TARGET_LABELS[r.target_type] ?? r.target_type}</span>
                      <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium capitalize', STATUS_STYLES[r.status] ?? 'bg-secondary')}>{r.status}</span>
                      <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-foreground">{r.reason}</p>
                    {r.target_label && <p className="text-xs text-muted-foreground">Target: {r.target_label}</p>}
                    {r.details && <p className="mt-0.5 text-sm text-muted-foreground">{r.details}</p>}
                    {link && <Link to={link} className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">View target <ExternalLink className="h-3 w-3" /></Link>}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Button size="sm" variant="outline" className="h-7 rounded-full text-xs" disabled={act.isPending} onClick={() => act.mutate({ report: r, action: 'reviewing', status: 'reviewing' })}>Reviewing</Button>
                  <Button size="sm" variant="outline" className="h-7 rounded-full text-xs" disabled={act.isPending} onClick={() => act.mutate({ report: r, action: 'escalate', status: 'escalated' })}>Escalate</Button>
                  <Button size="sm" variant="outline" className="h-7 rounded-full text-xs" disabled={act.isPending} onClick={() => act.mutate({ report: r, action: 'takedown', status: 'resolved', note: notes[r.id] })}>Takedown</Button>
                  <Button size="sm" variant="outline" className="h-7 rounded-full text-xs" disabled={act.isPending} onClick={() => act.mutate({ report: r, action: 'dismiss', status: 'dismissed', note: notes[r.id] })}>Dismiss</Button>
                  <Button size="sm" className="h-7 rounded-full text-xs" disabled={act.isPending} onClick={() => act.mutate({ report: r, action: 'resolve', status: 'resolved', note: notes[r.id] })}>Resolve</Button>
                  <button onClick={() => setExpanded(isOpen ? null : r.id)} className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                    Notes & history ({history.length}) <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isOpen && 'rotate-180')} />
                  </button>
                </div>

                {isOpen && (
                  <div className="mt-3 space-y-2 border-t border-border/50 pt-3">
                    <div className="flex gap-2">
                      <Input
                        value={notes[r.id] ?? ''}
                        onChange={(e) => setNotes((p) => ({ ...p, [r.id]: e.target.value }))}
                        placeholder="Add an internal note…"
                        className="h-8 text-sm"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 flex-shrink-0 gap-1"
                        disabled={act.isPending || !(notes[r.id] ?? '').trim()}
                        onClick={() => {
                          act.mutate({ report: r, action: 'note', note: notes[r.id]?.trim() });
                          setNotes((p) => ({ ...p, [r.id]: '' }));
                        }}
                      >
                        <MessageSquarePlus className="h-4 w-4" /> Note
                      </Button>
                    </div>
                    {history.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No actions yet.</p>
                    ) : (
                      <ul className="space-y-1">
                        {history.map((a) => (
                          <li key={a.id} className="flex items-baseline gap-2 text-xs text-muted-foreground">
                            <span className="font-medium capitalize text-foreground/80">{a.action}</span>
                            {a.note && <span className="truncate">— {a.note}</span>}
                            <span className="ml-auto flex-shrink-0">{formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
