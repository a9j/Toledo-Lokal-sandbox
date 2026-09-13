import { Bell, Store, CalendarDays, MapPin, Footprints, Inbox as InboxIcon } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Badge } from '@/components/ui/badge';
import { HeroImage } from '@/components/ui/hero-image';
import { EntityCard, EntityCardSkeleton } from '@/components/ui/entity-card';
import { StatCard } from '@/components/ui/stat-card';
import { InboxRow, InboxRowSkeleton } from '@/components/ui/inbox-row';
import { SectionHeader } from '@/components/ui/section-header';
import { DEMO_ART } from '@/lib/demo-art-manifest';
import { artUrl } from '@/lib/bundled-art';
import { EmptyState } from '@/components/ui/empty-state';
import { ProfileHeader, ProgressRing } from '@/components/profile/ProfileHeader';

/**
 * The component kit, on one page.
 *
 * This exists so the design can be looked at without a database behind it.
 * Every component here is rendered with sample props, which means the kit can
 * be reviewed, screenshotted and compared across light and dark on any machine,
 * including ones that cannot reach Supabase.
 */

// Two of these carry no art on purpose: a card whose thing has no picture is a
// real case, and the kit is where that has to keep looking deliberate.
const SAMPLES = [
  { kind: 'business', kindLabel: 'Business', name: 'Glass City Coffee Roasters', context: '0.3 miles away · Downtown', art: 'cafe-coffee' },
  { kind: 'event', kindLabel: 'Event', name: 'Saturday Farmers Market', context: 'Tomorrow, 9:00 AM', art: 'ev-market' },
  { kind: 'neighborhood', kindLabel: 'Neighborhood', name: 'Old West End', context: '412 places · 18 events this week', art: 'bld-victorian' },
  { kind: 'deal', kindLabel: 'Deal', name: 'Two for one breakfast', context: 'Ends Sunday', art: 'obj-deal' },
  { kind: 'job', kindLabel: 'Job', name: 'Line Cook, full time', context: '$16 to $19 an hour', art: null },
  { kind: 'property', kindLabel: 'Property', name: '742 Broadway St', context: 'Trash day Tuesday · District 3', art: null },
];

export default function ComponentKit() {
  return (
    <>
      <Header title="Component kit" showBack />

      <HeroImage
        kind="neighborhood"
        url={artUrl('bld-victorian')}
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

        <SectionHeader title="Profile header" subtitle="Cover, avatar over the edge, verified only when earned" />
        <div className="mb-4 overflow-hidden rounded-2xl border border-border/60">
          <ProfileHeader
            name="Anthony Anderson"
            neighborhood="Old West End"
            since="March 2026"
            verified
            editable
          />
          <div className="h-4" />
        </div>
        <div className="mb-8 overflow-hidden rounded-2xl border border-border/60">
          <ProfileHeader name="Dana Reyes" neighborhood="East Toledo" since="January 2026" />
          <div className="h-4" />
        </div>

        <SectionHeader title="Passport progress" />
        <div className="mb-8 rounded-2xl border border-border/60 bg-card p-4">
          <ProgressRing value={34} total={60} label="Passport stamps"
                        sublabel="9 of 9 neighborhoods visited" />
        </div>

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
              imageUrl={artUrl(s.art)}
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
            url={artUrl('ev-market')}
            title="Saturday Farmers Market"
            ratio="16/9"
            eyebrow={<Badge variant="secondary" className="bg-background/85 backdrop-blur-sm">Event</Badge>}
          />
        </div>

        <SectionHeader
          title={`Demo pictures, all ${DEMO_ART.length}`}
          subtitle="Drawings, not photographs. The sandbox has no real ones."
        />
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
          Seeded rows point at one of these by key. They are cropped here the way
          a card crops them, so a scene that only works uncropped shows up as a
          problem on this page rather than in a list.
        </p>
        <ul className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {DEMO_ART.map((art) => (
            <li key={art.key}>
              <img
                src={artUrl(art.key) ?? ''}
                alt={art.title}
                loading="lazy"
                className="aspect-video w-full rounded-xl border border-border/60 object-cover"
              />
              <p className="mt-1 truncate text-[11px] text-muted-foreground" title={art.title}>
                {art.key}
              </p>
            </li>
          ))}
        </ul>
      </PageContainer>
    </>
  );
}
