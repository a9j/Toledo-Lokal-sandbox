import { Phone, Globe, Instagram, Facebook, Clock, Sparkles, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LocationsSection } from '@/components/business/LocationsSection';
import { getHoursList } from '@/lib/business-hours';
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

const PERSONALIZATION = [
  { match: '94% match', reason: 'Because you like locally owned spots' },
  { match: 'Popular nearby', reason: 'Pairs well with coffee, parks, and events around here' },
];

export function AboutTab({ business, actions }: { business: ProfileBusiness; actions: ResolvedAction[] }) {
  const story = business.story?.trim() || business.description?.trim();
  const aboutModules = getFilledModulesForSection(business.profileCategory, business.moduleContent, 'about');
  const hours = getHoursList(business.hours);
  const tiktokUrl = business.tiktok ? socialHref('tiktok', business.tiktok) : null;

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
            <ModuleCard key={module.id} module={module} values={business.moduleContent[module.id]} />
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

      {/* Hours */}
      {hours && (
        <ProfileCard className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Hours</p>
          </div>
          <div className="space-y-1">
            {hours.map((row) => (
              <div key={row.day} className={cn('flex items-center justify-between text-sm', row.isToday ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                <span>{row.day}</span>
                <span>{row.label}</span>
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

      {/* Personalization-ready (mock for now) */}
      <div className="space-y-2">
        <SectionLabel>For you</SectionLabel>
        {PERSONALIZATION.map((p) => (
          <ProfileCard key={p.reason} className="flex items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Heart className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{p.match}</p>
              <p className="text-xs text-muted-foreground">{p.reason}</p>
            </div>
          </ProfileCard>
        ))}
      </div>

      {/* Report */}
      <div className="pt-1 text-center">
        <ReportDialog targetType="business" targetId={business.id} targetLabel={business.name} />
      </div>
    </div>
  );
}
