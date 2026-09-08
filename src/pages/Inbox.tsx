import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Inbox as InboxIcon, ChevronRight, LogIn } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { useAuth } from '@/contexts/AuthContext';
import { useCivicInbox } from '@/hooks/useCivicInbox';
import { eventTypeLabel, entityPath, type InboxEntry } from '@/integrations/supabase/city-os';

/**
 * Civic Inbox.
 *
 * Everything you follow, in one list, grouped by day. Rows arrive from the fan
 * out trigger on the CityGraph change log, so this page only reads.
 */
export default function Inbox() {
  const { user } = useAuth();
  const { days, unreadIds, isLoading, error, markRead } = useCivicInbox();

  // Opening the inbox is what marks it read. Fires once per set of unread ids.
  const unreadKey = unreadIds.join(',');
  useEffect(() => {
    if (unreadIds.length > 0) markRead.mutate(unreadIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unreadKey]);

  if (!user) {
    return (
      <>
        <Header title="Inbox" showBack />
        <PageContainer>
          <EmptyState
            title="Sign in to see your inbox"
            body="Follow a business, an event or your neighborhood and every change shows up here."
            action={
              <Button asChild>
                <Link to="/auth">
                  <LogIn className="mr-1.5 h-4 w-4" />
                  Sign in
                </Link>
              </Button>
            }
          />
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header title="Inbox" showBack />
      <PageContainer>
        <div className="mb-5">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Inbox</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Changes to everything you follow.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ) : error ? (
          /* A failed request is not an empty inbox. Saying "nothing yet" here
             would tell someone their follows had vanished. */
          <EmptyState
            title="Could not load your inbox"
            body="Check your connection and try again."
          />
        ) : days.length === 0 ? (
          <EmptyState
            title="Nothing yet"
            body="Follow a business, an event or your neighborhood and its changes land here."
            action={
              <Button asChild variant="secondary">
                <Link to="/discover">Find something to follow</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-7">
            {days.map((day) => (
              <section key={day.date}>
                <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {day.label}
                </h2>
                <div className="space-y-2.5">
                  {day.entries.map((entry) => (
                    <InboxRow key={entry.id} entry={entry} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </PageContainer>
    </>
  );
}

function InboxRow({ entry }: { entry: InboxEntry }) {
  const { log } = entry;
  const entity = log.entity;
  const href = entity ? entityPath(entity) : null;
  const unread = !entry.read_at;

  const inner = (
    <div className="flex items-start gap-3">
      {/* Unread marker. Reserved space either way so rows do not shift. */}
      <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" style={{ opacity: unread ? 1 : 0 }} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-[10px] font-medium">
            {eventTypeLabel(log.event_type)}
          </Badge>
          {entity && (
            <span className="truncate text-xs font-medium text-muted-foreground">
              {entity.name}
            </span>
          )}
        </div>
        <p className="mt-1.5 text-sm font-semibold leading-snug">{log.title}</p>
        {log.body && (
          <p className="mt-1 text-sm leading-snug text-muted-foreground">{log.body}</p>
        )}
      </div>

      {href && <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />}
    </div>
  );

  const className =
    'block rounded-xl border border-border/60 bg-card p-3.5 transition-colors' +
    (href ? ' hover:border-border hover:bg-muted/40' : '');

  return href ? (
    <Link to={href} className={className}>
      {inner}
    </Link>
  ) : (
    <div className={className}>{inner}</div>
  );
}

function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
        <InboxIcon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h2 className="font-heading text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
