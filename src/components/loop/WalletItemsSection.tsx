import { useState } from 'react';
import { Ticket, Gift, BusFront, BadgePercent, HeartHandshake, IdCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useWalletItems, WALLET_KIND_LABEL, type WalletItem } from '@/hooks/useEconomy';

const KIND_ICON: Record<string, typeof Ticket> = {
  gift_card: Gift,
  ticket: Ticket,
  coupon: BadgePercent,
  transit: BusFront,
  volunteer_credit: HeartHandshake,
  membership: IdCard,
};

function valueLabel(item: WalletItem): string | null {
  if (item.value_cents === null) return null;
  if (item.kind === 'transit' || item.kind === 'volunteer_credit') {
    return `${item.quantity} left`;
  }
  return `$${(item.value_cents / 100).toFixed(2)}`;
}

function expiryLabel(item: WalletItem): string | null {
  if (!item.expires_at) return null;
  const date = new Date(item.expires_at);
  const days = Math.ceil((date.getTime() - Date.now()) / 86_400_000);
  if (item.expired) return 'Expired';
  if (days <= 7) return `${days} day${days === 1 ? '' : 's'} left`;
  return `until ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

/**
 * Everything in the wallet that is not points.
 *
 * Points live in loop_wallets and keep their own card above this. A gift card,
 * a bus pass and a museum membership are not points and would be a lie if
 * stored as points, so they are their own rows and their own section.
 */
export function WalletItemsSection({ className }: { className?: string }) {
  const [includeUsed, setIncludeUsed] = useState(false);
  const { data: items, isLoading, error } = useWalletItems(includeUsed);

  if (isLoading) {
    return <Skeleton className={'h-28 w-full rounded-xl ' + (className ?? '')} />;
  }

  // Nothing to show and nothing broken: stay quiet rather than carry an empty card.
  if (error) return null;
  if ((!items || items.length === 0) && !includeUsed) return null;

  return (
    <section className={className}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-heading text-base font-semibold">Everything else</h2>
        <button
          type="button"
          onClick={() => setIncludeUsed((v) => !v)}
          className="text-xs font-medium text-primary"
        >
          {includeUsed ? 'Hide used' : 'Show used'}
        </button>
      </div>

      {!items || items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing here yet.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const Icon = KIND_ICON[item.kind] ?? Ticket;
            const value = valueLabel(item);
            const expiry = expiryLabel(item);
            return (
              <div
                key={item.id}
                className={
                  'flex gap-3 rounded-xl border border-border/60 bg-card p-4 ' +
                  (item.used_at || item.expired ? 'opacity-60' : '')
                }
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" className="text-[10px]">
                      {WALLET_KIND_LABEL[item.kind] ?? item.kind}
                    </Badge>
                    {item.used_at && (
                      <Badge variant="outline" className="text-[10px]">
                        Used
                      </Badge>
                    )}
                    {item.expired && !item.used_at && (
                      <Badge variant="outline" className="text-[10px]">
                        Expired
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm font-semibold leading-snug">{item.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {[item.business_name ?? item.issuer, value, expiry].filter(Boolean).join(' · ')}
                  </p>
                  {item.code && (
                    <p className="mt-1 font-mono text-xs tracking-wide text-muted-foreground">
                      {item.code}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
