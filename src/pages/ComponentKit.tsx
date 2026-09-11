import { Bell, Store, CalendarDays, MapPin, Footprints, Inbox as InboxIcon } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Badge } from '@/components/ui/badge';
import { HeroImage } from '@/components/ui/hero-image';
import { EntityCard, EntityCardSkeleton } from '@/components/ui/entity-card';
import { StatCard } from '@/components/ui/stat-card';
import { InboxRow, InboxRowSkeleton } from '@/components/ui/inbox-row';
import { SectionHeader } from '@/components/ui/section-header';
import { EmptyState } from '@/components/ui/empty-state';

/**
 * The component kit, on one page.
 *
 * This exists so the design can be looked at without a database behind it.
 * Every component here is rendered with sample props, which means the kit can
 * be reviewed, screenshotted and compared across light and dark on any machine,
 * including ones that cannot reach Supabase.
 */

const SAMPLES = [
  { kind: 'business', kindLabel: 'Business', name: 'Glass City Coffee Roasters', context: '0.3 miles away · Downtown' },
  { kind: 'event', kindLabel: 'Event', name: 'Saturday Farmers Market', context: 'Tomorrow, 9:00 AM' },
  { kind: 'neighborhood', kindLabel: 'Neighborhood', name: 'Old West End', context: '412 places · 18 events this week' },
  { kind: 'deal', kindLabel: 'Deal', name: 'Two for one breakfast', context: 'Ends Sunday' },
  { kind: 'job', kindLabel: 'Job', name: 'Line Cook, full time', context: '$16 to $19 an hour' },
  { kind: 'property', kindLabel: 'Property', name: '742 Broadway St', context: 'Trash day Tuesday · District 3' },
];

export default function ComponentKit() {
  return (
    <>
      <Header title="Component kit" showBack />

      <HeroImage
        kind="neighborhood"
        title="Old West End"
        ratio="4/3"
        eyebrow={
          <>
            <Badge variant="secondary" className="bg-background/85 backdrop-blur-sm">Neighborhood</Badge>
            <span className="text-xs text-white/80">412 places</span>
          </>
        }
      />

      <PageContainer>
        <p className="mb-6 mt-4 text-sm leading-relaxed text-muted-foreground">
          Every shared component, with sample content. Nothing here talks to the
          database, so this page looks the same everywhere and can be used to
          review the design on its own.
        </p>

        <SectionHeader title="Stat cards" subtitle="Big number, quiet label" />
        <div className="mb-8 grid grid-cols-2 gap-3">
          <StatCard value={128} label="Places discovered" icon={Store} trend={12} trendLabel="+12 this month" />
          <StatCard value={9} label="Neighborhoods visited" icon={MapPin} />
          <StatCard value={34} label="Passport stamps" icon={Footprints} trend={-2} trendLabel="-2 this month" />
          <StatCard value="12h" label="Volunteer hours" icon={CalendarDays} />
        </div>

        <SectionHeader title="Entity cards" seeAllHref="/explore" />
        <div className="mb-8 grid grid-cols-2 gap-3">
          {SAMPLES.map((s) => (
            <EntityCard
              key={s.kind}
              name={s.name}
              kind={s.kind}
              kindLabel={s.kindLabel}
              context={s.context}
              href="#"
            />
          ))}
        </div>

        <SectionHeader title="Loading" subtitle="What a list looks like before it arrives" />
        <div className="mb-8 grid grid-cols-2 gap-3">
          <EntityCardSkeleton />
          <EntityCardSkeleton />
        </div>

        <SectionHeader title="Inbox rows" seeAllHref="/inbox" />
        <div className="mb-8 divide-y divide-border/50 rounded-2xl border border-border/60 bg-card px-3">
          <InboxRow
            title="Glass City Coffee changed their hours"
            body="Open until 8pm on Fridays from next week."
            meta="Business · 2 hours ago"
            kind="business"
            unread
          />
          <InboxRow
            title="A new deal near Old West End"
            meta="Deal · Yesterday"
            kind="deal"
          />
          <InboxRow
            title="742 Broadway St was revalued"
            meta="Property · Tuesday"
            kind="property"
          />
          <InboxRowSkeleton />
        </div>

        <SectionHeader title="Empty state" />
        <div className="mb-8 rounded-2xl border border-border/60 bg-card">
          <EmptyState
            icon={InboxIcon}
            title="Nothing new yet"
            description="Follow a place, a street or a neighborhood and its changes show up here."
            actionLabel="Find something to follow"
            actionHref="/search"
          />
        </div>

        <SectionHeader title="Hero, 16 by 9" subtitle="The ratio used on list cards" />
        <div className="mb-10 overflow-hidden rounded-2xl">
          <HeroImage
            kind="event"
            title="Saturday Farmers Market"
            ratio="16/9"
            eyebrow={<Badge variant="secondary" className="bg-background/85 backdrop-blur-sm">Event</Badge>}
          />
        </div>
      </PageContainer>
    </>
  );
}
