import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useEntityChanges } from '@/hooks/useEntityChanges';
import { useEntityId, type EntityRef } from '@/hooks/useEntityFollow';
import { eventTypeLabel } from '@/integrations/supabase/city-os';

interface RecentChangesProps {
  entityId?: string | null;
  source?: EntityRef;
  title?: string;
  limit?: number;
  className?: string;
}

function whenLabel(iso: string): string {
  const then = new Date(iso).getTime();
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * "Recent changes" for one entity, read straight from the CityGraph change
 * log. Renders nothing when there is nothing to show, so a quiet page stays
 * quiet instead of carrying an empty card.
 */
export function RecentChanges({
  entityId,
  source,
  title = 'Recent changes',
  limit = 5,
  className,
}: RecentChangesProps) {
  const resolved = useEntityId(entityId ? undefined : source);
  const id = entityId ?? resolved.data ?? null;
  const { data: changes, isLoading } = useEntityChanges(id, limit);

  if (isLoading || resolved.isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (!changes || changes.length === 0) return null;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {changes.map((change) => (
          <div key={change.id} className="flex gap-3">
            <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-[10px] font-medium">
                  {eventTypeLabel(change.event_type)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {whenLabel(change.occurs_at ?? change.created_at)}
                </span>
              </div>
              <p className="mt-1 text-sm font-medium leading-snug">{change.title}</p>
              {change.body && (
                <p className="mt-0.5 text-sm leading-snug text-muted-foreground">{change.body}</p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
