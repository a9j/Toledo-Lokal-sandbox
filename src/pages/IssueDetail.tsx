import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Check, Loader2, HandHeart } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { useAuth } from '@/contexts/AuthContext';
import { FollowButton } from '@/components/city-os/FollowButton';
import { RecentChanges } from '@/components/city-os/RecentChanges';
import {
  useIssue,
  useMyReportedIssueIds,
  usePledge,
  ISSUE_STATUSES,
} from '@/hooks/useCityHelp';

const PLEDGE_KINDS = [
  { key: 'money' as const, label: 'Money', unit: '$' },
  { key: 'hours' as const, label: 'Hours', unit: 'h' },
  { key: 'materials' as const, label: 'Materials', unit: '' },
];

/** reported → assigned → scheduled → completed, or stopped at declined. */
function StatusTracker({ status }: { status: string }) {
  if (status === 'declined') {
    return (
      <div className="rounded-xl border border-border/60 bg-muted/50 p-3.5">
        <p className="text-sm font-medium">Not planned</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          This one will not be worked on.
        </p>
      </div>
    );
  }

  const currentIndex = ISSUE_STATUSES.indexOf(status as (typeof ISSUE_STATUSES)[number]);

  return (
    <div className="flex items-center">
      {ISSUE_STATUSES.map((step, i) => {
        const done = i <= currentIndex;
        return (
          <div key={step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={
                  'flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-semibold ' +
                  (done
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border/60 bg-card text-muted-foreground')
                }
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span
                className={
                  'text-[10px] capitalize ' +
                  (done ? 'font-medium text-foreground' : 'text-muted-foreground')
                }
              >
                {step}
              </span>
            </div>
            {i < ISSUE_STATUSES.length - 1 && (
              <div
                className={
                  'mx-1 mb-4 h-0.5 flex-1 rounded ' + (i < currentIndex ? 'bg-primary' : 'bg-border')
                }
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ProgressBar({
  label,
  have,
  need,
  unit,
}: {
  label: string;
  have: number;
  need: number;
  unit: string;
}) {
  const pct = need > 0 ? Math.min(100, Math.round((have / need) * 100)) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">
          {unit}
          {have} of {unit}
          {need}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function IssueDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: issue, isLoading, error } = useIssue(id);
  const { data: myIds } = useMyReportedIssueIds();
  const pledge = usePledge();

  const [kind, setKind] = useState<'money' | 'hours' | 'materials'>('hours');
  const [amount, setAmount] = useState('');

  if (isLoading) {
    return (
      <>
        <Header title="Report" showBack />
        <PageContainer>
          <Skeleton className="h-32 w-full rounded-xl" />
        </PageContainer>
      </>
    );
  }

  if (error || !issue) {
    return (
      <>
        <Header title="Report" showBack />
        <PageContainer>
          <div className="py-16 text-center">
            <h1 className="font-heading text-lg font-semibold">
              {error ? 'Could not load this report' : 'Report not found'}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {error ? 'Check your connection and try again.' : 'It may have been removed.'}
            </p>
            <Button asChild variant="secondary" className="mt-5">
              <Link to="/fix">Back to Fix Toledo</Link>
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  const needs = (issue.needs ?? {}) as Record<string, number>;
  const progress = (issue.progress ?? {}) as Record<string, number>;
  const isMine = !!id && myIds?.has(id);

  const submitPledge = () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error('Enter an amount above zero.');
      return;
    }
    pledge.mutate(
      { issueId: issue.id, kind, amount: value },
      {
        onSuccess: () => {
          setAmount('');
          toast.success('Pledged. Thank you.');
        },
        onError: (e: Error) => toast.error(e.message || 'Could not record that pledge.'),
      },
    );
  };

  return (
    <>
      <Header title={issue.is_government ? 'Report' : 'Needs you'} showBack />
      <PageContainer>
        <div className="mb-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-[10px] capitalize">
              {issue.kind.replace(/_/g, ' ')}
            </Badge>
            {isMine && (
              <Badge variant="outline" className="text-[10px]">
                You reported this
              </Badge>
            )}
          </div>
          <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">{issue.title}</h1>
          {issue.description && (
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {issue.description}
            </p>
          )}
        </div>

        {issue.is_government && (
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <StatusTracker status={issue.status} />
          </div>
        )}

        {!issue.is_government && Object.keys(needs).length > 0 && (
          <div className="space-y-4 rounded-xl border border-border/60 bg-card p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <HandHeart className="h-4 w-4 text-muted-foreground" />
              What it needs
            </h2>
            {PLEDGE_KINDS.filter((k) => needs[k.key]).map((k) => (
              <ProgressBar
                key={k.key}
                label={k.label}
                have={progress[k.key] ?? 0}
                need={needs[k.key] ?? 0}
                unit={k.unit}
              />
            ))}
          </div>
        )}

        {!issue.is_government && user && (
          <div className="mt-4 space-y-3 rounded-xl border border-border/60 bg-card p-4">
            <h2 className="text-sm font-semibold">Pledge something</h2>
            <div className="flex gap-2">
              {PLEDGE_KINDS.map((k) => (
                <button
                  key={k.key}
                  type="button"
                  onClick={() => setKind(k.key)}
                  className={
                    'flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ' +
                    (kind === k.key
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/60 bg-card hover:bg-muted/40')
                  }
                >
                  {k.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="How much"
                inputMode="decimal"
                aria-label="Pledge amount"
              />
              <Button onClick={submitPledge} disabled={pledge.isPending || !amount}>
                {pledge.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Pledge
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Only the running total is public. What you pledged stays private.
            </p>
          </div>
        )}

        <div className="mt-4">
          <FollowButton source={{ table: 'issues', id: issue.id }} className="w-full" />
        </div>

        <div className="mt-6">
          <RecentChanges source={{ table: 'issues', id: issue.id }} title="What has happened" />
        </div>
      </PageContainer>
    </>
  );
}
