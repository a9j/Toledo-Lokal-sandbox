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
import { MapPin, QrCode, Compass } from 'lucide-react';
import logoImage from '@/assets/tl-logo.png';

export default function Today() {
  const { user, isLoading: authLoading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const today = new Date();
  const { data: dailyDrop, isLoading } = useDailyDrop(today);

  // Check if drop is from a previous day (stale)
  const isStale = dailyDrop && !dateFnsIsToday(parseISO(dailyDrop.drop_date));

  useEffect(() => {
    if (authLoading) return;
    
    if (user) {
      localStorage.setItem('onboarding-completed', 'true');
      setShowOnboarding(false);
    } else {
      const hasSeenOnboarding = localStorage.getItem('onboarding-completed');
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [user, authLoading]);

  if (showOnboarding) {
    return <FirstVisitOnboarding onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <SEOHead
        title="Today | ToledoLokal"
        description="Your daily edition of Toledo - events, businesses, and community moments"
        url="/"
      />

      <div className="px-4 pt-safe-top">
        {/* Brand Header */}
        <header className="flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <img 
              src={logoImage} 
              alt="ToledoLokal" 
              className="w-9 h-9 rounded-lg object-contain"
            />
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">
                Toledo<span className="text-primary">Lokal</span>
              </h1>
            </div>
          </div>
          
          {/* Quick actions */}
          <div className="flex items-center gap-2">
            <Link 
              to="/loop-wallet"
              className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            >
              <QrCode className="h-4 w-4 text-muted-foreground" />
            </Link>
          </div>
        </header>

        {/* Content */}
        <div className="space-y-4 pb-4">
          {isLoading ? (
            // Loading skeleton
            <>
              <Skeleton className="h-32 rounded-2xl" />
              <Skeleton className="h-48 rounded-2xl" />
              <Skeleton className="h-36 rounded-2xl" />
            </>
          ) : dailyDrop ? (
            // Daily Drop content
            <>
              <DailyDropHeader 
                date={parseISO(dailyDrop.drop_date)} 
                title={dailyDrop.title}
                isStale={isStale}
              />
              
              {dailyDrop.highlights.length > 0 && (
                <TodayInToledo highlights={dailyDrop.highlights} />
              )}
              
              {dailyDrop.spotlights.length > 0 && (
                <LiveLocalSpotlight spotlights={dailyDrop.spotlights} />
              )}
              
              {dailyDrop.moment && (
                <CommunityMoment moment={dailyDrop.moment} />
              )}
            </>
          ) : (
            // No daily drop available
            <EmptyDailyDrop date={today} />
          )}

          {/* Quick Access Footer */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Link 
              to="/near-me"
              className="card-elevated flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-lokal-forest/10 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-lokal-forest" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">Near Me</p>
                <p className="text-xs text-muted-foreground">Open now</p>
              </div>
            </Link>
            
            <Link 
              to="/discover"
              className="card-elevated flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Compass className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">Discover</p>
                <p className="text-xs text-muted-foreground">Search & browse</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
