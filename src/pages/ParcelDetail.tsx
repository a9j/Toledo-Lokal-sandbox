import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin,
  Trash2,
  Recycle,
  Snowflake,
  Landmark,
  GraduationCap,
  Vote,
  DollarSign,
  Receipt,
  type LucideIcon,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { FollowButton } from '@/components/city-os/FollowButton';
import { RecentChanges } from '@/components/city-os/RecentChanges';
import { ConfidenceBadge } from '@/components/city-os/ConfidenceBadge';
import { useEntityId } from '@/hooks/useEntityFollow';

/**
 * Property page.
 *
 * Phase 0 asked for a follow button on every parcel page, and there was no
 * parcel page for one to live on. This is it: the facts the city keeps about
 * one address, and a way to be told when any of them change.
 */

const money = (value: number | null) =>
  value === null || value === undefined
    ? null
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(value);

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 border-b border-border/50 py-3 last:border-0">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="ml-auto text-right text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

export default function ParcelDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: parcel, isLoading } = useQuery({
    queryKey: ['parcel', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parcels')
        .select(
          'id, parcel_number, address, zip, council_district, precinct, school_district, ' +
            'refuse_day, recycling_week, snow_route, assessed_value, tax_year_amount, ' +
            'neighborhood:neighborhoods(id, name)',
        )
        .eq('id', id as string)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const entity = useEntityId(id ? { table: 'parcels', id } : undefined);

  if (isLoading) {
    return (
      <>
        <Header title="Property" showBack />
        <PageContainer>
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="mt-2 h-4 w-1/3" />
          <Skeleton className="mt-6 h-48 w-full" />
        </PageContainer>
      </>
    );
  }

  if (!parcel) {
    return (
      <>
        <Header title="Property" showBack />
        <PageContainer>
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <MapPin className="h-6 w-6 text-muted-foreground" />
            </div>
            <h1 className="font-heading text-lg font-semibold">We could not find that address</h1>
            <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted-foreground">
              It may have been removed, or the link may be wrong.
            </p>
            <Button asChild variant="outline" className="mt-5">
              <Link to="/search">Search the city</Link>
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header title="Property" showBack />
      <PageContainer>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{parcel.address}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {parcel.neighborhood ? (
            <Link to={`/neighborhood/${parcel.neighborhood.id}`} className="hover:text-primary">
              {parcel.neighborhood.name}
            </Link>
          ) : null}
          {parcel.neighborhood && parcel.zip ? ' · ' : null}
          {parcel.zip}
        </p>

        <div className="mt-4">
          <FollowButton source={{ table: 'parcels', id: parcel.id }} label="Follow this address" />
          <p className="mt-2 text-xs text-muted-foreground">
            Get an inbox note when the value, the taxes or the pickup days change.
          </p>
        </div>

        <ConfidenceBadge entityId={entity.data} className="mt-4" />

        <section className="mt-6 rounded-xl border border-border/60 bg-card px-4">
          <Row icon={Trash2} label="Trash day" value={parcel.refuse_day} />
          <Row icon={Recycle} label="Recycling week" value={parcel.recycling_week} />
          <Row icon={Snowflake} label="Snow route" value={parcel.snow_route} />
          <Row icon={Landmark} label="Council district" value={parcel.council_district} />
          <Row icon={GraduationCap} label="School district" value={parcel.school_district} />
          <Row icon={Vote} label="Precinct" value={parcel.precinct} />
          <Row icon={DollarSign} label="Assessed value" value={money(parcel.assessed_value)} />
          <Row icon={Receipt} label="Property tax" value={money(parcel.tax_year_amount)} />
          <Row icon={MapPin} label="Parcel number" value={parcel.parcel_number} />
        </section>

        <section className="mt-6">
          <h2 className="mb-2 font-heading text-base font-semibold">What changed here</h2>
          <RecentChanges source={{ table: 'parcels', id: parcel.id }} />
        </section>
      </PageContainer>
    </>
  );
}
