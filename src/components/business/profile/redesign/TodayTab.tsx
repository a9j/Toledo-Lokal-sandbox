import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Coins, CalendarClock, CalendarDays, Clock, MapPin } from 'lucide-react';
import { getFilledModulesForSection } from '@/lib/profile-modules';
import { resolveLiveStatus } from '@/lib/business-profile-config';
import { ProfileBusiness } from './profile-types';
import { ModuleCard } from './ModuleCard';
import { ProfileCard, EmptyState, ActivityPill, SectionLabel } from './ProfilePrimitives';

export function TodayTab({ business }: { business: ProfileBusiness }) {
  const todayModules = getFilledModulesForSection(business.profileCategory, business.moduleContent, 'today');

  const { data: upcomingEvents } = useQuery({
    queryKey: ['business-upcoming-events', business.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('events')
        .select('id, title, start_date_time, end_date_time, location_text')
        .eq('business_id', business.id)
        .eq('status', 'approved')
        .gt('start_date_time', new Date().toISOString())
        .order('start_date_time', { ascending: true })
        .limit(5);
      return data || [];
    },
  });

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

      {/* Upcoming events */}
      {upcomingEvents && upcomingEvents.length > 0 && (
        <div className="space-y-2">
          <SectionLabel>Upcoming events</SectionLabel>
          {upcomingEvents.map((evt) => {
            const dt = new Date(evt.start_date_time);
            return (
              <ProfileCard key={evt.id} className="flex items-start gap-3">
                <div className="flex flex-col items-center justify-center w-11 h-11 rounded-xl bg-primary/10 shrink-0">
                  <span className="text-[9px] font-semibold text-primary uppercase">
                    {dt.toLocaleDateString(undefined, { month: 'short' })}
                  </span>
                  <span className="text-base font-bold text-primary leading-none">
                    {dt.getDate()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{evt.title}</p>
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-0.5">
                      <Clock className="h-3 w-3" />
                      {dt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                    </span>
                    {evt.location_text && (
                      <span className="inline-flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" />
                        {evt.location_text}
                      </span>
                    )}
                  </div>
                </div>
              </ProfileCard>
            );
          })}
        </div>
      )}

      {todayModules.length > 0 ? (
        <div className="space-y-3">
          <SectionLabel>What's happening today</SectionLabel>
          {todayModules.map((module) => (
            <ModuleCard key={module.id} module={module} values={business.moduleContent[module.id] ?? {}} />
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
            {resolveLiveStatus(business).map((line) => (
              <ActivityPill key={line} icon={Sparkles}>{line}</ActivityPill>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
