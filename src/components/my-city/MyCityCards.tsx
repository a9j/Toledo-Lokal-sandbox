import { Link } from 'react-router-dom';
import {
  Home,
  Trash2,
  Recycle,
  Snowflake,
  MapPin,
  Landmark,
  Store,
  Radio,
  ChevronRight,
  ShieldCheck,
  Receipt,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { eventTypeLabel } from '@/integrations/supabase/city-os';
import {
  useMyHome,
  useNearMe,
  useNearbyBusinesses,
  type MyHome,
  type NearMeItem,
} from '@/hooks/useMyCity';

/**
 * My City.
 *
 * The cards a resident sees once they have set a home address, in the order
 * the plan calls for: My Home, My Neighborhood, My Representatives, Near Me,
 * New Businesses Near Me.
 */

/** Placeholder data must always say so. Never let seed values read as fact. */
function SeedNotice({ source }: { source: string }) {
  if (source !== 'seed') return null;
  return (
    <p className="mt-3 rounded-lg bg-muted/60 px-3 py-2 text-xs leading-snug text-muted-foreground">
      These are placeholder values for testing, not your real city records. Check with the
      City of Toledo before you rely on them.
    </p>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Trash2;
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="ml-auto text-sm font-medium">{value ?? 'Not on file'}</span>
    </div>
  );
}

function MyHomeCard({ home }: { home: MyHome }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Home className="h-4 w-4" />
              My Home
            </CardTitle>
            <Link
              to={`/parcel/${home.parcel_id}`}
              className="mt-1 block truncate text-sm text-muted-foreground hover:text-primary"
            >
              {home.address}
            </Link>
          </div>
          {home.verified_at ? (
            <Badge variant="secondary" className="shrink-0 gap-1">
              <ShieldCheck className="h-3 w-3" />
              Verified
            </Badge>
          ) : (
            <Button asChild size="sm" variant="outline" className="shrink-0">
              <Link to="/my-city/verify">Verify</Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Row icon={Trash2} label="Trash day" value={home.refuse_day} />
        <Row
          icon={Recycle}
          label="Recycling"
          value={home.recycling_week ? `Week ${home.recycling_week}` : null}
        />
        <Row icon={Snowflake} label="Snow route" value={home.snow_route} />
        <SeedNotice source={home.source} />
      </CardContent>
    </Card>
  );
}

function MyNeighborhoodCard({ home }: { home: MyHome }) {
  if (!home.neighborhood_id) return null;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="h-4 w-4" />
          My Neighborhood
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Link
          to={`/neighborhood/${home.neighborhood_id}`}
          className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3 transition-colors hover:border-border hover:bg-muted/40"
        >
          <span className="flex-1 text-sm font-medium">{home.neighborhood_name}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </CardContent>
    </Card>
  );
}

function MyRepresentativesCard({ home }: { home: MyHome }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Landmark className="h-4 w-4" />
          My Representatives
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Row icon={Landmark} label="Council district" value={home.council_district} />
        <Row icon={MapPin} label="Precinct" value={home.precinct} />
        <Row icon={Landmark} label="School district" value={home.school_district} />
        <p className="pt-1 text-xs leading-snug text-muted-foreground">
          Contact details for your council member are coming next. For now, look up your
          district on the City of Toledo site.
        </p>
        <SeedNotice source={home.source} />
      </CardContent>
    </Card>
  );
}

function NearMeCard({ items, isLoading }: { items: NearMeItem[]; isLoading: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Radio className="h-4 w-4" />
          Near Me
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing has changed near you lately. That is usually good news.
          </p>
        ) : (
          <div className="space-y-4">
            {items.slice(0, 5).map((item) => (
              <div key={item.log_id} className="flex gap-3">
                <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="text-[10px] font-medium">
                      {eventTypeLabel(item.event_type)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {item.scope === 'neighborhood'
                        ? 'Your neighborhood'
                        : item.distance_miles != null
                          ? `${item.distance_miles} mi away`
                          : item.entity_name}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium leading-snug">{item.title}</p>
                  {item.body && (
                    <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
                      {item.body}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NewBusinessesCard() {
  const { data: businesses, isLoading } = useNearbyBusinesses(1, 6);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Store className="h-4 w-4" />
          New Businesses Near Me
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ) : !businesses || businesses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing new within a mile yet.
          </p>
        ) : (
          <div className="space-y-2">
            {businesses.map((business) => (
              <Link
                key={business.business_id}
                to={`/business/${business.business_id}`}
                className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3 transition-colors hover:border-border hover:bg-muted/40"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{business.name}</span>
                  <span className="block text-xs capitalize text-muted-foreground">
                    {business.category.replace(/_/g, ' ')}
                    {business.distance_miles != null && ` · ${business.distance_miles} mi`}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** The whole My City stack. Renders nothing useful without a home set. */
export function MyCityCards() {
  const { data: home, isLoading: homeLoading } = useMyHome();
  const { data: nearMe, isLoading: nearLoading } = useNearMe(0.5, 20);

  if (homeLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
    );
  }

  if (!home) return null;

  return (
    <div className="space-y-4">
      <MyHomeCard home={home} />
      <MyNeighborhoodCard home={home} />
      <MyRepresentativesCard home={home} />
      <NearMeCard items={nearMe ?? []} isLoading={nearLoading} />
      <NewBusinessesCard />

      {home.tax_year_amount != null && (
        <Button asChild variant="secondary" className="w-full">
          <Link to="/my-city/receipt">
            <Receipt className="mr-1.5 h-4 w-4" />
            See where your taxes go
          </Link>
        </Button>
      )}
    </div>
  );
}
