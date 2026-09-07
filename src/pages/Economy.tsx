import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Repeat, Handshake, TriangleAlert, Store } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { SEOHead } from '@/components/seo/SEOHead';
import {
  useEconomicLoop,
  useB2BRequests,
  type B2BRequest,
  type EconomicLoop,
} from '@/hooks/useEconomy';

function money(amount: number | null): string | null {
  if (amount === null || amount === undefined) return null;
  return `$${Math.round(amount).toLocaleString()}`;
}

function budgetLabel(request: B2BRequest): string {
  const { budget_min: min, budget_max: max } = request;
  if (request.is_barter) return 'Swap, not cash';
  if (min && max) return `${money(min)} to ${money(max)}`;
  if (max) return `up to ${money(max)}`;
  if (min) return `from ${money(min)}`;
  return 'Budget not listed';
}

function RequestCard({ request }: { request: B2BRequest }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="flex flex-wrap items-center gap-1.5">
        {request.is_barter && (
          <Badge variant="secondary" className="text-[10px]">
            Skill swap
          </Badge>
        )}
        {request.need_category && (
          <Badge variant="outline" className="text-[10px] capitalize">
            {request.need_category.replace(/_/g, ' ')}
          </Badge>
        )}
        {request.neighborhood_name && (
          <span className="text-[11px] text-muted-foreground">{request.neighborhood_name}</span>
        )}
      </div>

      <p className="mt-1.5 text-sm font-semibold leading-snug">{request.title}</p>
      {request.poster_name && (
        <p className="mt-0.5 text-xs text-muted-foreground">
          Posted by{' '}
          {request.poster_business_id ? (
            <Link to={`/business/${request.poster_business_id}`} className="font-medium text-primary">
              {request.poster_name}
            </Link>
          ) : (
            request.poster_name
          )}
        </p>
      )}
      {request.description && (
        <p className="mt-1.5 text-sm leading-snug text-muted-foreground">{request.description}</p>
      )}
      <p className="mt-2 text-xs text-muted-foreground">{budgetLabel(request)}</p>
    </div>
  );
}

/**
 * The Local Economic Loop, plus the two boards that feed it.
 *
 * The chain is drawn from supplier tags, which are public. Spend is summed from
 * loop_transactions, which is the only record of money moving this app holds. In
 * a sandbox with no transactions the honest answer is that there is nothing to
 * show, so that is what it says rather than drawing an empty chart.
 */
export default function Economy() {
  const [board, setBoard] = useState<'all' | 'barter'>('all');
  const { data: loop, isLoading, error } = useEconomicLoop();
  const requests = useB2BRequests(board === 'barter');

  const localShare = useMemo(() => {
    if (!loop || loop.supplier_count === 0) return null;
    return Math.round((loop.local_supplier_count / loop.supplier_count) * 100);
  }, [loop]);

  // Group the chain by buyer so it reads as "this shop buys from these people"
  // rather than as a list of pairs.
  const byBuyer = useMemo(() => {
    type Link = EconomicLoop['links'][number];
    const map = new Map<string, { buyer: string; businessId: string; suppliers: Link[] }>();
    for (const link of loop?.links ?? []) {
      const existing = map.get(link.business_id);
      if (existing) existing.suppliers.push(link);
      else map.set(link.business_id, { buyer: link.buyer, businessId: link.business_id, suppliers: [link] });
    }
    return [...map.values()].sort((a, b) => b.suppliers.length - a.suppliers.length);
  }, [loop]);

  return (
    <>
      <SEOHead
        title="The local loop | ToledoLokal"
        description="Where Toledo businesses buy from, how much of it stays local, and what they are looking for."
      />
      <Header title="The local loop" showBack />
      <PageContainer>
        <div className="mb-5">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">The local loop</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every dollar a Toledo business spends locally comes round again. This is who buys from
            whom.
          </p>
        </div>

        {isLoading ? (
          <Skeleton className="h-28 w-full rounded-xl" />
        ) : error ? (
          <div className="flex gap-3 rounded-xl border border-border/60 bg-muted/40 p-4">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Could not load the loop. Check your connection and try again.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-border/60 bg-card p-4">
                <p className="text-xl font-semibold leading-none">{loop?.supplier_count ?? 0}</p>
                <p className="mt-1 text-xs text-muted-foreground">Supply links</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-4">
                <p className="text-xl font-semibold leading-none">
                  {loop?.local_supplier_count ?? 0}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Stay in Toledo</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-4">
                <p className="text-xl font-semibold leading-none">
                  {localShare === null ? '—' : `${localShare}%`}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Local share</p>
              </div>
            </div>

            {/* Spend is a separate claim from the chain, and only one of them
                has data here. Saying so beats an empty chart. */}
            {!loop?.has_spend_data && (
              <p className="mt-3 rounded-xl border border-border/60 bg-muted/50 px-4 py-3 text-xs leading-snug text-muted-foreground">
                No Loop spend has been recorded yet, so there is no monthly total to show. The
                chain below is drawn from what businesses say about their suppliers, which does
                not depend on points moving.
              </p>
            )}

            <section className="mt-6">
              <h2 className="mb-3 flex items-center gap-2 font-heading text-base font-semibold">
                <Repeat className="h-4 w-4 text-muted-foreground" />
                The chain
              </h2>
              {byBuyer.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No business has tagged a supplier yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {byBuyer.map((group) => (
                    <div
                      key={group.businessId}
                      className="rounded-xl border border-border/60 bg-card p-4"
                    >
                      <Link
                        to={`/business/${group.businessId}`}
                        className="text-sm font-semibold hover:text-primary"
                      >
                        {group.buyer}
                      </Link>
                      <ul className="mt-2 space-y-1.5">
                        {group.suppliers.map((link, i) => (
                          <li
                            key={`${link.supplier_id ?? link.supplier}-${i}`}
                            className="flex items-center gap-2 text-sm"
                          >
                            <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                            {link.supplier_id ? (
                              <Link
                                to={`/business/${link.supplier_id}`}
                                className="font-medium hover:text-primary"
                              >
                                {link.supplier}
                              </Link>
                            ) : (
                              <span>{link.supplier}</span>
                            )}
                            {link.category && (
                              <span className="text-xs text-muted-foreground">
                                {link.category}
                              </span>
                            )}
                            {!link.is_local && (
                              <Badge variant="outline" className="text-[10px]">
                                Out of town
                              </Badge>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-heading text-base font-semibold">
              <Handshake className="h-4 w-4 text-muted-foreground" />
              What businesses are looking for
            </h2>
            <div className="flex gap-2">
              {(['all', 'barter'] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBoard(b)}
                  className={
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors ' +
                    (board === b
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/60 bg-card hover:bg-muted/40')
                  }
                >
                  {b === 'all' ? 'All' : 'Swaps'}
                </button>
              ))}
            </div>
          </div>

          {requests.isLoading ? (
            <Skeleton className="h-24 w-full rounded-xl" />
          ) : requests.error ? (
            <p className="text-sm text-muted-foreground">
              Could not load the board. Check your connection and try again.
            </p>
          ) : !requests.data || requests.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {board === 'barter'
                ? 'Nobody is offering a swap right now.'
                : 'Nothing on the board right now. A business owner can post from their dashboard.'}
            </p>
          ) : (
            <div className="space-y-3">
              {requests.data.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </section>

        <div className="mt-8 rounded-xl border border-border/60 bg-card p-4">
          <div className="flex items-start gap-3">
            <Store className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-semibold">Thinking of starting something</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Ten steps, in order, with what to check at each one.
              </p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button asChild size="sm" variant="secondary">
              <Link to="/start-a-business">Start a business</Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link to="/spaces">Find a space</Link>
            </Button>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
