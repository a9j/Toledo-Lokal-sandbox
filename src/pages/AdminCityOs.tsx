import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, X, Loader2, Wrench, BookOpen, Blocks, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { useAuth } from '@/contexts/AuthContext';
import { ISSUE_STATUSES } from '@/hooks/useCityHelp';
import {
  useAdminIssues,
  useSetIssueStatus,
  usePendingMemories,
  useReviewMemory,
  useAdminPlugins,
  useSetPluginStatus,
} from '@/hooks/useCityOsAdmin';

const ISSUE_FILTERS = ['reported', 'assigned', 'scheduled', 'completed', 'declined'];

function IssuesQueue() {
  const [filter, setFilter] = useState<string>('reported');
  const { data: issues, isLoading } = useAdminIssues(filter);
  const setStatus = useSetIssueStatus();

  return (
    <div>
      <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
        {ISSUE_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={
              'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors ' +
              (filter === s
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border/60 bg-card hover:bg-muted/40')
            }
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton className="h-24 w-full rounded-xl" />
      ) : !issues || issues.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nothing {filter}.
        </p>
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => (
            <div key={issue.id} className="rounded-xl border border-border/60 bg-card p-4">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary" className="text-[10px] capitalize">
                  {issue.kind.replace(/_/g, ' ')}
                </Badge>
                {!issue.is_government && (
                  <Badge variant="outline" className="text-[10px]">
                    Needs neighbours
                  </Badge>
                )}
              </div>
              <Link to={`/fix/${issue.id}`} className="mt-1.5 block text-sm font-semibold hover:text-primary">
                {issue.title}
              </Link>
              {issue.description && (
                <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                  {issue.description}
                </p>
              )}

              {/* Who reported it is deliberately not here. It lives in
                  issue_reporters and an admin queue is not a reason to surface
                  it next to the report. */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {[...ISSUE_STATUSES, 'declined'].map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={issue.status === s ? 'default' : 'outline'}
                    disabled={issue.status === s || setStatus.isPending}
                    onClick={() =>
                      setStatus.mutate(
                        { id: issue.id, status: s },
                        {
                          onSuccess: () => toast.success(`Moved to ${s}.`),
                          onError: () => toast.error('Could not change that.'),
                        },
                      )
                    }
                    className="text-xs capitalize"
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MemoryQueue() {
  const { data: memories, isLoading } = usePendingMemories();
  const review = useReviewMemory();

  if (isLoading) return <Skeleton className="h-24 w-full rounded-xl" />;
  if (!memories || memories.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nothing waiting. Approved memories appear on the place they belong to.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs leading-snug text-muted-foreground">
        Approving publishes it and tells everyone following that place. Rejecting deletes it,
        rather than leaving it in a rejected pile attached to whoever wrote it.
      </p>
      {memories.map((memory) => (
        <div key={memory.id} className="rounded-xl border border-border/60 bg-card p-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[10px] capitalize">
              {memory.kind}
            </Badge>
            {memory.year && (
              <Badge variant="outline" className="text-[10px] tabular-nums">
                {memory.year}
              </Badge>
            )}
            {memory.entity_name && (
              <span className="text-[11px] text-muted-foreground">{memory.entity_name}</span>
            )}
          </div>
          <p className="mt-1.5 text-sm font-semibold leading-snug">{memory.title}</p>
          {memory.body && (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{memory.body}</p>
          )}
          <p className="mt-1.5 text-xs text-muted-foreground">
            {memory.contributor_name ? `From ${memory.contributor_name}` : 'No contributor named'}
          </p>

          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              disabled={review.isPending}
              onClick={() =>
                review.mutate(
                  { id: memory.id, approve: true },
                  {
                    onSuccess: () => toast.success('Published.'),
                    onError: () => toast.error('Could not approve that.'),
                  },
                )
              }
            >
              {review.isPending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="mr-1.5 h-3.5 w-3.5" />
              )}
              Publish
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={review.isPending}
              onClick={() =>
                review.mutate(
                  { id: memory.id, approve: false },
                  {
                    onSuccess: () => toast.success('Deleted.'),
                    onError: () => toast.error('Could not delete that.'),
                  },
                )
              }
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function PluginQueue() {
  const { data: plugins, isLoading } = useAdminPlugins();
  const setStatus = useSetPluginStatus();

  if (isLoading) return <Skeleton className="h-24 w-full rounded-xl" />;
  if (!plugins || plugins.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No plugins yet.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs leading-snug text-muted-foreground">
        A manifest is third party content. The database refuses a javascript link, a data link,
        a protocol relative route and an unknown action kind before it is ever stored, but read
        what each action actually does before publishing it.
      </p>
      {plugins.map((plugin) => (
        <div key={plugin.id} className="rounded-xl border border-border/60 bg-card p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{plugin.name}</p>
            <Badge variant="outline" className="text-[10px] capitalize">
              {plugin.status}
            </Badge>
          </div>
          {plugin.summary && (
            <p className="mt-0.5 text-sm text-muted-foreground">{plugin.summary}</p>
          )}
          <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-muted/60 p-3 text-[11px] leading-relaxed">
            {JSON.stringify(plugin.manifest, null, 1)}
          </pre>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {['draft', 'review', 'published', 'suspended'].map((s) => (
              <Button
                key={s}
                size="sm"
                variant={plugin.status === s ? 'default' : 'outline'}
                disabled={plugin.status === s || setStatus.isPending}
                onClick={() =>
                  setStatus.mutate(
                    { id: plugin.id, status: s },
                    {
                      onSuccess: () => toast.success(`Moved to ${s}.`),
                      onError: () => toast.error('Could not change that.'),
                    },
                  )
                }
                className="text-xs capitalize"
              >
                {s}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * One admin console for the City OS queues.
 *
 * Three things shipped with a tested write path and no screen behind it: issue
 * status, memory approval and plugin review. This is that screen. The gate is
 * the same `isAdmin` the rest of the admin pages use, and every write still
 * goes through RLS, so a non admin who reaches this URL can see the page frame
 * and change nothing.
 */
export default function AdminCityOs() {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <>
        <Header title="City OS admin" showBack />
        <PageContainer>
          <Skeleton className="h-40 w-full rounded-xl" />
        </PageContainer>
      </>
    );
  }

  if (!user || !isAdmin) {
    return (
      <>
        <Header title="City OS admin" showBack />
        <PageContainer>
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <ShieldAlert className="h-6 w-6 text-muted-foreground" />
            </div>
            <h1 className="font-heading text-lg font-semibold">Staff only</h1>
            <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted-foreground">
              This page is for platform admins.
            </p>
            <Button variant="secondary" className="mt-5" onClick={() => navigate('/')}>
              Back to Toledo
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header title="City OS admin" showBack />
      <PageContainer>
        <div className="mb-5">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">City OS admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reports, memories waiting for a human, and plugins waiting to be read.
          </p>
        </div>

        <Tabs defaultValue="issues">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="issues" className="text-xs">
              <Wrench className="mr-1.5 h-3.5 w-3.5" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="memories" className="text-xs">
              <BookOpen className="mr-1.5 h-3.5 w-3.5" />
              Memories
            </TabsTrigger>
            <TabsTrigger value="plugins" className="text-xs">
              <Blocks className="mr-1.5 h-3.5 w-3.5" />
              Plugins
            </TabsTrigger>
          </TabsList>

          <TabsContent value="issues" className="mt-4">
            <IssuesQueue />
          </TabsContent>
          <TabsContent value="memories" className="mt-4">
            <MemoryQueue />
          </TabsContent>
          <TabsContent value="plugins" className="mt-4">
            <PluginQueue />
          </TabsContent>
        </Tabs>
      </PageContainer>
    </>
  );
}
