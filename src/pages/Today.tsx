import { useState, useEffect } from 'react';
import { format, parseISO, isToday as dateFnsIsToday } from 'date-fns';
import { useDailyDrop } from '@/hooks/useDailyDrop';
import { DailyDropHeader } from '@/components/today/DailyDropHeader';
import { TodayInToledo } from '@/components/today/TodayInToledo';
import { LiveLocalSpotlight } from '@/components/today/LiveLocalSpotlight';
import { CommunityMoment } from '@/components/today/CommunityMoment';
import { EmptyDailyDrop } from '@/components/today/EmptyDailyDrop';
import { SEOHead } from '@/components/seo/SEOHead';
import { Skeleton } from '@/components/ui/skeleton';
import { FirstVisitOnboarding } from '@/components/onboarding/FirstVisitOnboarding';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { MapPin, QrCode, Compass, Sparkles, ChevronRight } from 'lucide-react';
import logoImage from '@/assets/tl-logo.png';

export default function Today() {
  const { user, isLoading: authLoading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(() => {
    // Check localStorage synchronously so first-time visitors see onboarding instantly
    return !localStorage.getItem('onboarding-completed');
  });
  const today = new Date();
  const { data: dailyDrop, isLoading } = useDailyDrop(today);

  // Check if drop is from a previous day (stale)
  const isStale = dailyDrop && !dateFnsIsToday(parseISO(dailyDrop.drop_date));

  useEffect(() => {
    if (authLoading) return;
    // Logged-in users skip onboarding
    if (user) {
      localStorage.setItem('onboarding-completed', 'true');
      setShowOnboarding(false);
    }
  }, [user, authLoading]);

  if (showOnboarding) {
    return <FirstVisitOnboarding onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 pb-24">
      <SEOHead
        title="Today | ToledoLokal"
        description="Your daily edition of Toledo - events, businesses, and community moments"
        url="/"
      />

      <div className="px-4 pt-safe-top">
        {/* Premium Brand Header */}
        <header className="flex items-center justify-between py-5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-lokal-amber border-2 border-background flex items-center justify-center">
                <span className="text-[8px] font-bold text-foreground">✦</span>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                Toledo<span className="text-primary">Lokal</span>
              </h1>
              <p className="text-xs text-muted-foreground font-medium">The Glass City</p>
            </div>
          </div>
          
          {/* Quick actions */}
          <div className="flex items-center gap-2">
            <Link 
              to="/loop-wallet"
              className="w-10 h-10 rounded-xl bg-card border border-border/40 flex items-center justify-center hover:bg-muted/50 hover:border-border transition-all duration-200 shadow-sm"
            >
              <QrCode className="h-4.5 w-4.5 text-muted-foreground" />
            </Link>
          </div>
        </header>

        {/* Content */}
        <div className="space-y-5 pb-4">
          {isLoading ? (
            // Loading skeleton with stagger
            <div className="space-y-4">
              <Skeleton className="h-36 rounded-2xl animate-pulse" />
              <Skeleton className="h-52 rounded-2xl animate-pulse" style={{ animationDelay: '100ms' }} />
              <Skeleton className="h-40 rounded-2xl animate-pulse" style={{ animationDelay: '200ms' }} />
            </div>
          ) : dailyDrop ? (
            // Daily Drop content
            <div className="space-y-4">
              <div className="animate-fade-in-up">
                <DailyDropHeader 
                  date={parseISO(dailyDrop.drop_date)} 
                  title={dailyDrop.title}
                  isStale={isStale}
                />
              </div>
              
              {dailyDrop.highlights.length > 0 && (
                <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                  <TodayInToledo highlights={dailyDrop.highlights} />
                </div>
              )}
              
              {dailyDrop.spotlights.length > 0 && (
                <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                  <LiveLocalSpotlight spotlights={dailyDrop.spotlights} />
                </div>
              )}
              
              {dailyDrop.moment && (
                <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                  <CommunityMoment moment={dailyDrop.moment} />
                </div>
              )}
            </div>
          ) : (
            // No daily drop available
            <EmptyDailyDrop date={today} />
          )}

          {/* Quick Access Cards */}
          <div className="grid grid-cols-2 gap-3 pt-3">
            <Link 
              to="/near-me"
              className="group card-elevated flex items-center gap-3 p-4 hover:bg-lokal-forest/5 hover:border-lokal-forest/20 transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-lokal-forest/15 to-lokal-forest/5 flex items-center justify-center group-hover:from-lokal-forest/20 group-hover:to-lokal-forest/10 transition-all duration-200">
                <MapPin className="h-5 w-5 text-lokal-forest" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm">Near Me</p>
                <p className="text-xs text-muted-foreground">Open now</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-lokal-forest group-hover:translate-x-0.5 transition-all" />
            </Link>
            
            <Link 
              to="/discover"
              className="group card-elevated flex items-center gap-3 p-4 hover:bg-primary/5 hover:border-primary/20 transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center group-hover:from-primary/20 group-hover:to-primary/10 transition-all duration-200">
                <Compass className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm">Discover</p>
                <p className="text-xs text-muted-foreground">Browse all</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}