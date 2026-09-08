import { useState } from 'react';
import { Store, Mail, Phone, TriangleAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { SEOHead } from '@/components/seo/SEOHead';
import { FollowButton } from '@/components/city-os/FollowButton';
import { useSpaces, SPACE_KINDS, type Space } from '@/hooks/useEconomy';

function money(amount: number | null): string | null {
  if (amount === null || amount === undefined) return null;
  return `$${Math.round(amount).toLocaleString()}`;
}

function SpaceCard({ space }: { space: Space }) {
  const facts = [
    space.sqft ? `${space.sqft.toLocaleString()} sq ft` : null,
    space.rent_monthly ? `${money(space.rent_monthly)} a month` : 'Rent not listed',
    space.available_from
      ? `from ${new Date(space.available_from).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        })}`
      : null,
  ].filter(Boolean);

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="secondary" className="text-[10px] capitalize">
          {SPACE_KINDS.find((k) => k.value === space.kind)?.label ?? space.kind}
        </Badge>
        {space.status === 'under_offer' && (
          <Badge variant="outline" className="text-[10px]">
            Under offer
          </Badge>
        )}
      </div>

      <p className="mt-1.5 text-sm font-semibold leading-snug">{space.name}</p>
      {space.address && <p className="mt-0.5 text-xs text-muted-foreground">{space.address}</p>}
      {space.description && (
        <p className="mt-1.5 text-sm leading-snug text-muted-foreground">{space.description}</p>
      )}

      <p className="mt-2 text-xs text-muted-foreground">{facts.join(' · ')}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {space.contact_email && (
          <Button asChild size="sm" variant="outline">
            <a href={`mailto:${space.contact_email}`}>
              <Mail className="mr-1.5 h-3.5 w-3.5" />
              Ask about it
            </a>
          </Button>
        )}
        {space.contact_phone && (
          <Button asChild size="sm" variant="ghost">
            <a href={`tel:${space.contact_phone}`}>
              <Phone className="mr-1.5 h-3.5 w-3.5" />
              {space.contact_phone}
            </a>
          </Button>
        )}
        <FollowButton source={{ table: 'spaces', id: space.id }} size="sm" variant="outline" />
      </div>
    </div>
  );
}

/**
 * Empty Space.
 *
 * Storefronts, kitchens, yards and studios that are free right now. A listing is
 * a place entity, so it can be followed and it turns up in Ask Toledo.
 */
export default function Spaces() {
  const [kinds, setKinds] = useState<string[]>([]);
  const { data: spaces, isLoading, error } = useSpaces(kinds);

  const toggle = (value: string) =>
    setKinds((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));

  return (
    <>
      <SEOHead
        title="Empty space | ToledoLokal"
        description="Shops, kitchens, offices and yards available to rent in Toledo right now."
      />
      <Header title="Empty space" showBack />
      <PageContainer>
        <div className="mb-4">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Empty space</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {spaces ? `${spaces.length} places` : 'Places'} you could open in. Follow one and you
            will hear when it goes.
          </p>
        </div>

        <div className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1">
          {SPACE_KINDS.map((k) => (
            <button
              key={k.value}
              type="button"
              onClick={() => toggle(k.value)}
              className={
                'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ' +
                (kinds.includes(k.value)
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border/60 bg-card hover:bg-muted/40')
              }
            >
              {k.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-36 w-full rounded-xl" />
            <Skeleton className="h-36 w-full rounded-xl" />
          </div>
        ) : error ? (
          <div className="flex gap-3 rounded-xl border border-border/60 bg-muted/40 p-4">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Could not load the listings. Check your connection and try again.
            </p>
          </div>
        ) : !spaces || spaces.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <Store className="h-6 w-6 text-muted-foreground" />
            </div>
            <h2 className="font-heading text-lg font-semibold">Nothing listed right now</h2>
            <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted-foreground">
              {kinds.length > 0 ? 'Try clearing a filter.' : 'Check back in a week.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {spaces.map((space) => (
              <SpaceCard key={space.id} space={space} />
            ))}
          </div>
        )}

        <p className="mt-6 text-xs leading-snug text-muted-foreground">
          Sandbox data. These listings are made up for testing and the contact addresses do not
          work.
        </p>
      </PageContainer>
    </>
  );
}
