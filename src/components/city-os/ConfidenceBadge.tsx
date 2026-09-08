import { ShieldCheck, ShieldQuestion, FlaskConical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useEntityProvenance } from '@/hooks/useDataSources';

interface ConfidenceBadgeProps {
  entityId: string | null | undefined;
  className?: string;
}

function when(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Says where a fact came from and how sure we are, in one line.
 *
 * A blank space reads as fact. Seeded data that says nothing about itself is
 * the same as a claim, so this renders something for every entity, including
 * the invented ones, where the honest answer is that it was made up for
 * testing.
 */
export function ConfidenceBadge({ entityId, className }: ConfidenceBadgeProps) {
  const { data, isLoading } = useEntityProvenance(entityId);

  if (isLoading || !data || !data.source_name) return null;

  const verified = when(data.verified_at);
  const fetched = when(data.fetched_at);

  if (data.is_seed) {
    return (
      <div className={'flex items-start gap-2 ' + (className ?? '')}>
        <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <p className="text-xs leading-snug text-muted-foreground">
          Sandbox data. This was made up for testing and nobody has checked it.
        </p>
      </div>
    );
  }

  return (
    <div className={'flex items-start gap-2 ' + (className ?? '')}>
      {verified ? (
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
      ) : (
        <ShieldQuestion className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      )}
      <p className="text-xs leading-snug text-muted-foreground">
        From {data.source_name}
        {fetched ? `, pulled ${fetched}` : null}
        {'. '}
        {verified
          ? `A person checked this on ${verified}.`
          : 'Nobody has checked this one by hand yet.'}
        {typeof data.confidence === 'number' && (
          <Badge variant="outline" className="ml-1.5 align-middle text-[10px]">
            {Math.round(data.confidence * 100)}% sure
          </Badge>
        )}
      </p>
    </div>
  );
}
