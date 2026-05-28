import { Heart, Users, CalendarHeart, HandHeart, Store, Sprout } from 'lucide-react';
import { getFilledModulesForSection } from '@/lib/profile-modules';
import { LocalImpactMeter } from '@/components/business/profile/LocalImpactMeter';
import { ProfileBusiness } from './profile-types';
import { ModuleCard } from './ModuleCard';
import { ProfileCard, SectionLabel } from './ProfilePrimitives';

const FUTURE_IMPACT = [
  { icon: Store, label: 'Locally owned & operated' },
  { icon: Users, label: 'Supports local hiring' },
  { icon: HandHeart, label: 'Partners with Toledo nonprofits' },
  { icon: CalendarHeart, label: 'Hosts community events' },
  { icon: Sprout, label: 'Sources from local makers' },
];

export function CommunityTab({ business }: { business: ProfileBusiness }) {
  const impactModules = getFilledModulesForSection(business.profileCategory, business.moduleContent, 'community_impact');

  return (
    <div className="space-y-3">
      {/* Locally owned highlight */}
      <ProfileCard className="flex items-center gap-3 border-primary/20 bg-primary/5">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/15">
          <Heart className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Part of the Toledo local ecosystem</p>
          <p className="text-xs text-muted-foreground">Every visit keeps money and energy in the Glass City.</p>
        </div>
      </ProfileCard>

      {impactModules.length > 0 && (
        <div className="space-y-3">
          <SectionLabel>Impact</SectionLabel>
          {impactModules.map((module) => (
            <ModuleCard key={module.id} module={module} values={business.moduleContent[module.id]} />
          ))}
        </div>
      )}

      {/* Real engagement metrics */}
      <LocalImpactMeter businessId={business.id} />

      {/* Compact future-ready impact profile */}
      <ProfileCard className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Local Impact Profile coming soon</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            We'll track how this business supports Toledo through hiring, events, donations, partnerships, and neighborhood involvement.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {FUTURE_IMPACT.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon className="h-4 w-4 flex-shrink-0 text-primary/60" />
              {label}
            </div>
          ))}
        </div>
      </ProfileCard>
    </div>
  );
}
