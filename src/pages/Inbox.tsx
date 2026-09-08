import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Inbox as InboxIcon, CheckCheck, Settings, LogIn } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useCity } from '@/contexts/CityContext';
import { useInbox, useMarkInboxRead, type InboxItem } from '@/hooks/useCityOs';

function dayLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Earlier';
  const today = new Date();
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(d, today)) return 'Today';
  if (isSameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function Inbox() {
  const { user, isLoading: authLoading } = useAuth();
  const { city } = useCity();
  const navigate = useNavigate();
  const { data: items, isLoading } = useInbox();
  const markRead = useMarkInboxRead();

  const grouped = useMemo(() => {
    const byDay = new Map<string, InboxItem[]>();
    for (const item of items ?? []) {
      const key = dayLabel(item.created_at);
      const list = byDay.get(key) ?? [];
      list.push(item);
      byDay.set(key, list);
    }
    return Array.from(byDay.entries());
  }, [items]);

  const unreadIds = (items ?? []).filter((i) => !i.read_at).map((i) => i.id);

  if (authLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <InboxIcon className="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 className="font-heading text-lg font-semibold">Sign in to see your inbox</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Follow places around {city.name} and changes show up here.
        </p>
        <Button asChild className="mt-5">
          <Link to="/auth"><LogIn className="mr-1.5 h-4 w-4" />Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Your inbox</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            What changed at the places you follow.
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to="/settings/notifications" aria-label="Notification settings">
            <Settings className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {unreadIds.length > 0 && (
        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          disabled={markRead.isPending}
          onClick={() => markRead.mutate(unreadIds)}
        >
          <CheckCheck className="mr-1.5 h-4 w-4" />
          Mark all read
        </Button>
      )}

      {isLoading ? (
        <div className="mt-5 space-y-3">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      ) : grouped.length === 0 ? (
        <div className="py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <InboxIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">Nothing here yet</p>
          <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted-foreground">
            Follow a business, an event or your own street, and anything that changes
            will land here.
          </p>
          <Button asChild variant="secondary" className="mt-5">
            <Link to="/explore">Find something to follow</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-5 space-y-6">
          {grouped.map(([day, dayItems]) => (
            <section key={day}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {day}
              </h2>
              <div className="space-y-2">
                {dayItems.map((item) => (
                  <div
                    key={item.id}
                    className={
                      'rounded-xl border p-4 ' +
                      (item.read_at ? 'border-border/60 bg-card' : 'border-primary/40 bg-primary/5')
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{item.title}</p>
                        {item.body && (
                          <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
                            {item.body}
                          </p>
                        )}
                        {item.entity_name && (
                          <p className="mt-1 text-xs text-muted-foreground">{item.entity_name}</p>
                        )}
                      </div>
                      {!item.read_at && (
                        <Badge variant="secondary" className="shrink-0 text-[10px]">New</Badge>
                      )}
                    </div>
                    {!item.read_at && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-1.5 h-7 px-2 text-xs"
                        onClick={() => markRead.mutate([item.id])}
                      >
                        Mark read
                      </Button>
                    )}
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
