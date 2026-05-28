import { Link } from 'react-router-dom';
import { Sparkles, Coins, CalendarClock } from 'lucide-react';
import { getFilledModulesForSection } from '@/lib/profile-modules';
import { BUSINESS_TYPE_CONFIG } from '@/lib/business-profile-config';
import { ProfileBusiness } from './profile-types';
import { ModuleCard } from './ModuleCard';
import { ProfileCard, EmptyState, ActivityPill, SectionLabel } from './ProfilePrimitives';

export function TodayTab({ business }: { business: ProfileBusiness }) {
  const todayModules = getFilledModulesForSection(business.profileCategory, business.moduleContent, 'today');
  const config = BUSINESS_TYPE_CONFIG[business.profileCategory];

  return (
    <div className="space-y-3">
      {/* Reward nudge — keeps Today useful even with no posts */}
      {business.isInLoop && (
        <Link to="/loop" className="block">
          <ProfileCard className="flex items-center gap-3 border-primary/20 bg-primary/5">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/15">
              <Coins className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">Check in today and earn Loop Points</p>
              <p className="text-xs text-muted-foreground">Scan at checkout to rack up points toward rewards.</p>
            </div>
          </ProfileCard>
        </Link>
      )}

      {todayModules.length > 0 ? (
        <div className="space-y-3">
          <SectionLabel>What's happening today</SectionLabel>
          {todayModules.map((module) => (
            <ModuleCard key={module.id} module={module} values={business.moduleContent[module.id]} />
          ))}
        </div>
      ) : (
        <>
          <EmptyState
            icon={CalendarClock}
            title="Nothing new posted yet today"
            description="Today's specials, updates, and happenings from this business will show up here."
          />
          <div className="space-y-2">
            {config.liveStatus.map((line) => (
              <ActivityPill key={line} icon={Sparkles}>{line}</ActivityPill>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
