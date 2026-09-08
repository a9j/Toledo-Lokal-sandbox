import { Link } from 'react-router-dom';
import { HandHeart, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { useIssues, type Issue } from '@/hooks/useCityHelp';

const UNIT: Record<string, string> = { money: '$', hours: 'h', materials: '' };

function NeedRow({ issue }: { issue: Issue }) {
  const needs = (issue.needs ?? {}) as Record<string, number>;
  const progress = (issue.progress ?? {}) as Record<string, number>;
  const keys = Object.keys(needs);

  return (
    <Link
      to={`/fix/${issue.id}`}
      className="block rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-border hover:bg-muted/40"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug">{issue.title}</p>
          {issue.description && (
            <p className="mt-0.5 line-clamp-2 text-sm leading-snug text-muted-foreground">
              {issue.description}
            </p>
          )}
        </div>
        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      </div>

      {keys.length > 0 && (
        <div className="mt-3 space-y-2.5">
          {keys.map((key) => {
            const need = needs[key] ?? 0;
            const have = progress[key] ?? 0;
            const pct = need > 0 ? Math.min(100, Math.round((have / need) * 100)) : 0;
            return (
              <div key={key}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-xs capitalize text-muted-foreground">{key}</span>
                  <span className="text-xs text-muted-foreground">
                    {UNIT[key]}
                    {have} of {UNIT[key]}
                    {need}
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Link>
  );
}

/**
 * Toledo Needs You.
 *
 * The same table as Fix Toledo with `is_government` false: things the city will
 * not do that neighbours can, with what they still need on the front.
 */
export default function NeedsYou() {
  const { data: issues, isLoading } = useIssues({ isGovernment: false });

  return (
    <>
      <Header title="Toledo Needs You" showBack />
      <PageContainer>
        <div className="mb-5">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Toledo Needs You</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Things the city will not fix that neighbours can. Pledge money, hours or materials.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : !issues || issues.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <HandHeart className="h-6 w-6 text-muted-foreground" />
            </div>
            <h2 className="font-heading text-lg font-semibold">Nothing needs hands right now</h2>
            <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted-foreground">
              Start one from Fix Toledo by choosing Community project.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {issues.map((issue) => (
              <NeedRow key={issue.id} issue={issue} />
            ))}
          </div>
        )}
      </PageContainer>
    </>
  );
}
