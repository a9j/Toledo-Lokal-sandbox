import { Phone, Globe, Instagram, Facebook, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LocationsSection } from '@/components/business/LocationsSection';
import { useBusinessLocations } from '@/hooks/useBusinessLocations';
import { getHoursList, HoursRow } from '@/lib/business-hours';
import { getFilledModulesForSection } from '@/lib/profile-modules';
import { ResolvedAction } from '@/lib/business-profile-config';
import { ReportDialog } from '@/components/moderation/ReportDialog';
import { LocalSignals } from './LocalSignals';
import { cn } from '@/lib/utils';
import { ProfileBusiness } from './profile-types';
import { ModuleCard } from './ModuleCard';
import { ProfileCard, SectionLabel } from './ProfilePrimitives';

function socialHref(kind: 'instagram' | 'facebook' | 'tiktok', value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  const handle = value.replace(/^@/, '').trim();
  if (kind === 'instagram') return `https://instagram.com/${handle}`;
  if (kind === 'facebook') return `https://facebook.com/${handle}`;
  return `https://tiktok.com/@${handle}`;
}

export function AboutTab({ business, actions }: { business: ProfileBusiness; actions: ResolvedAction[] }) {
  const story = business.story?.trim() || business.description?.trim();
  const aboutModules = getFilledModulesForSection(business.profileCategory, business.moduleContent, 'about');
  const tiktokUrl = business.tiktok ? socialHref('tiktok', business.tiktok) : null;

  // Resolve hours per location. A multi-location business often keeps different
  // hours at each address, so rendering a single business-level schedule is
  // misleading. Every active location that defines its own hours becomes its own
  // labeled block; if no location defines hours we fall back to the single
  // business-level schedule.
  const { data: locations } = useBusinessLocations(business.id);
  const activeLocations = (locations ?? []).filter((l) => l.is_active);
  const locationHoursBlocks = activeLocations
    .map((loc, i) => ({
      key: loc.id ?? `loc-${i}`,
      label: loc.label || loc.neighborhood || loc.street_address || 'Location',
      rows: getHoursList(loc.hours),
    }))
    .filter((b): b is { key: string; label: string; rows: HoursRow[] } => b.rows !== null);

  const businessHours = getHoursList(business.hours);
  const hoursBlocks =
    locationHoursBlocks.length > 0
      ? locationHoursBlocks
      : businessHours
        ? [{ key: 'business', label: '', rows: businessHours }]
        : [];
  // Only label each block when there is more than one to disambiguate.
  const showHoursLabels = hoursBlocks.length > 1;

  return (
    <div className="space-y-3">
      {/* Story */}
      {story && (
        <ProfileCard className="space-y-1.5">
          <p className="text-sm font-semibold text-foreground">Our story</p>
          <p className="whitespace-pre-line text-sm text-muted-foreground">{story}</p>
        </ProfileCard>
      )}

      {/* What we're known for / good to know */}
      {aboutModules.length > 0 && (
        <div className="space-y-3">
          <SectionLabel>What we're known for</SectionLabel>
          {aboutModules.map((module) => (
            <ModuleCard key={module.id} module={module} values={business.moduleContent[module.id] ?? {}} />
          ))}
        </div>
      )}

      {/* Take action */}
      {actions.length > 0 && (
        <div className="space-y-2">
          <SectionLabel>Take action</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            {actions.map((action) => (
              <Button key={action.kind} variant="outline" onClick={action.onClick} className="h-11 justify-start gap-2 rounded-xl">
                <action.icon className="h-4 w-4 text-primary" />
                <span className="truncate">{action.label}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Hours — rendered per location when a multi-location business keeps
          different hours at each address */}
      {hoursBlocks.length > 0 && (
        <ProfileCard className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Hours</p>
          </div>
          <div className="space-y-3">
            {hoursBlocks.map((block) => (
              <div key={block.key} className="space-y-1">
                {showHoursLabels && (
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{block.label}</p>
                )}
                {block.rows.map((row) => (
                  <div key={row.day} className={cn('flex items-center justify-between text-sm', row.isToday ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                    <span>{row.day}</span>
                    <span>{row.label}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </ProfileCard>
      )}

      {/* Find us */}
      <div>
        <SectionLabel>Find us</SectionLabel>
        <LocationsSection businessId={business.id} businessName={business.name} />
      </div>

      {/* Contact */}
      <ProfileCard className="space-y-2">
        <p className="text-sm font-semibold text-foreground">Get in touch</p>
        {business.phone && (
          <a href={`tel:${business.phone.replace(/[^\d+]/g, '')}`} className="flex items-center gap-2 text-sm text-foreground hover:text-primary">
            <Phone className="h-4 w-4 text-muted-foreground" /> {business.phone}
          </a>
        )}
        {business.website && (
          <a href={/^https?:\/\//i.test(business.website) ? business.website : `https://${business.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 truncate text-sm text-foreground hover:text-primary">
            <Globe className="h-4 w-4 flex-shrink-0 text-muted-foreground" /> <span className="truncate">{business.website}</span>
          </a>
        )}
        {business.instagram && (
          <a href={socialHref('instagram', business.instagram)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-foreground hover:text-primary">
            <Instagram className="h-4 w-4 text-muted-foreground" /> Instagram
          </a>
        )}
        {business.facebook && (
          <a href={socialHref('facebook', business.facebook)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-foreground hover:text-primary">
            <Facebook className="h-4 w-4 text-muted-foreground" /> Facebook
          </a>
        )}
        {tiktokUrl && (
          <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-foreground hover:text-primary">
            <Sparkles className="h-4 w-4 text-muted-foreground" /> TikTok
          </a>
        )}
      </ProfileCard>

      {/* Local Signals — replaces the old reviews section */}
      <LocalSignals business={business} />

      {/* Report */}
      <div className="pt-1 text-center">
        <ReportDialog targetType="business" targetId={business.id} targetLabel={business.name} />
      </div>
    </div>
  );
}
