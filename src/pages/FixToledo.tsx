import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, MapPin, Loader2, LogIn, ChevronRight, HandHeart } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { useAuth } from '@/contexts/AuthContext';
import {
  useIssues,
  useReportIssue,
  ISSUE_KINDS,
  type Issue,
} from '@/hooks/useCityHelp';

const STATUS_LABEL: Record<string, string> = {
  reported: 'Reported',
  assigned: 'Assigned',
  scheduled: 'Scheduled',
  completed: 'Done',
  declined: 'Not planned',
};

function IssueRow({ issue }: { issue: Issue }) {
  return (
    <Link
      to={`/fix/${issue.id}`}
      className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-3.5 transition-colors hover:border-border hover:bg-muted/40"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-[10px] capitalize">
            {issue.kind.replace(/_/g, ' ')}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {STATUS_LABEL[issue.status] ?? issue.status}
          </span>
        </div>
        <p className="mt-1 text-sm font-semibold leading-snug">{issue.title}</p>
        {issue.description && (
          <p className="mt-0.5 line-clamp-2 text-sm leading-snug text-muted-foreground">
            {issue.description}
          </p>
        )}
      </div>
      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

/**
 * Fix Toledo.
 *
 * Camera first: a photo and a location say more than a form. Everything else is
 * optional, because a report nobody finishes helps nobody.
 */
export default function FixToledo() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const report = useReportIssue();

  const { data: govIssues, isLoading } = useIssues({ isGovernment: true });

  const [kind, setKind] = useState<string>('pothole');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const locate = () => {
    if (!navigator.geolocation) {
      toast.error('This device cannot share a location.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        toast.success('Location added.');
      },
      () => {
        setLocating(false);
        toast.error('Could not get your location. You can still report it.');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const submit = () => {
    report.mutate(
      {
        kind,
        title: title.trim(),
        description: description.trim() || undefined,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        isGovernment: kind !== 'community',
      },
      {
        onSuccess: (id) => {
          toast.success('Reported. You are following it, so updates come to your inbox.');
          navigate(`/fix/${id}`);
        },
        onError: () => toast.error('Could not send that report. Please try again.'),
      },
    );
  };

  return (
    <>
      <Header title="Fix Toledo" showBack />
      <PageContainer>
        <div className="mb-5">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Fix Toledo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Report something broken. You will see what happens to it.
          </p>
        </div>

        {!user ? (
          <div className="rounded-xl border border-border/60 bg-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Sign in to report something.</p>
            <Button asChild className="mt-3">
              <Link to="/auth">
                <LogIn className="mr-1.5 h-4 w-4" />
                Sign in
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3 rounded-xl border border-border/60 bg-card p-4">
            <div className="flex flex-wrap gap-2">
              {ISSUE_KINDS.map((k) => (
                <button
                  key={k.value}
                  type="button"
                  onClick={() => setKind(k.value)}
                  className={
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ' +
                    (kind === k.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/60 bg-card hover:bg-muted/40')
                  }
                >
                  {k.label}
                </button>
              ))}
            </div>

            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What is wrong, in a few words"
              maxLength={120}
              aria-label="What is wrong"
            />

            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Anything else worth knowing (optional)"
              rows={3}
              maxLength={800}
              aria-label="More detail"
            />

            <div className="flex gap-2">
              <Button
                type="button"
                variant={coords ? 'secondary' : 'outline'}
                className="flex-1"
                onClick={locate}
                disabled={locating}
              >
                {locating ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="mr-1.5 h-4 w-4" />
                )}
                {coords ? 'Location added' : 'Use my location'}
              </Button>
              {/* Photo upload lands with the media pipeline; the flow does not
                  block on it, because a report without a photo still helps. */}
              <Button type="button" variant="outline" disabled title="Photos are coming next">
                <Camera className="h-4 w-4" />
              </Button>
            </div>

            <Button
              className="w-full"
              onClick={submit}
              disabled={!title.trim() || report.isPending}
            >
              {report.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Send report
            </Button>
          </div>
        )}

        <div className="mt-7">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold tracking-tight">Reported so far</h2>
            <Link to="/needs-you" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              <HandHeart className="h-3.5 w-3.5" />
              Toledo Needs You
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          ) : !govIssues || govIssues.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing reported yet.</p>
          ) : (
            <div className="space-y-2">
              {govIssues.map((issue) => (
                <IssueRow key={issue.id} issue={issue} />
              ))}
            </div>
          )}
        </div>
      </PageContainer>
    </>
  );
}
