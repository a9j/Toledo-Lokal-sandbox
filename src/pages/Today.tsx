import { lazy, Suspense, useState, useEffect } from 'react';
import { parseISO, isToday as dateFnsIsToday } from 'date-fns';
import { useDailyDrop } from '@/hooks/useDailyDrop';
import { DailyDropHeader } from '@/components/today/DailyDropHeader';
import { TodayInToledo } from '@/components/today/TodayInToledo';
import { LiveLocalSpotlight } from '@/components/today/LiveLocalSpotlight';
import { CommunityMoment } from '@/components/today/CommunityMoment';
import { EmptyDailyDrop } from '@/components/today/EmptyDailyDrop';
import { SEOHead } from '@/components/seo/SEOHead';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

// Lazy-load onboarding — only shown to first-time visitors
const FirstVisitOnboarding = lazy(() => import('@/components/onboarding/FirstVisitOnboarding').then(m => ({ default: m.FirstVisitOnboarding })));
import { Link } from 'react-router-dom';
import { MapPin, QrCode, Compass, Sparkles, ChevronRight, UserCircle, LogIn } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/button';
import logoImage from '@/assets/tl-logo.png';
import { LP_ENABLED } from '@/lib/flags';

export default function Today() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('onboarding-completed');
  });
  const today = new Date();
  const { data: dailyDrop, isLoading } = useDailyDrop(today);

  // Check if user needs role selection
  const { data: profile } = useQuery({
    queryKey: ['profile-role-check', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('role_selected, profile_completed')
        .eq('user_id', user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  // Check if drop is from a previous day (stale)
  const isStale = dailyDrop && !dateFnsIsToday(parseISO(dailyDrop.drop_date));

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      localStorage.setItem('onboarding-completed', 'true');
      setShowOnboarding(false);
    }
  }, [user, authLoading]);

  // Redirect new users who haven't selected a role or completed profile
  useEffect(() => {
    if (user && profile) {
      if (profile.role_selected === false) {
        navigate('/role-select', { replace: true });
      } else if (profile.profile_completed === false) {
        navigate('/profile-setup', { replace: true });
      }
    }
  }, [user, profile, navigate]);

  if (showOnboarding) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <FirstVisitOnboarding onComplete={() => setShowOnboarding(false)} />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-[calc(9rem+env(safe-area-inset-bottom))]">
      <SEOHead
        title="Today | ToledoLokal"
        description="Your daily edition of Toledo - events, businesses, and community moments"
        url="/"
      />

      <div className="px-4 pt-safe-top">
        {/* Brand header — matches Discover */}
        <header className="flex items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-0">
            <img src={logoImage} alt="ToledoLokal" className="w-[60px] h-[60px] rounded-2xl object-contain" />
            <div className="-ml-1.5">
              <h1 className="text-xl font-bold text-foreground tracking-tight leading-none">
                Toledo<span className="text-primary">Lokal</span>
              </h1>
              <p className="text-[11px] text-muted-foreground font-medium mt-1">The Glass City</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {LP_ENABLED && (
              <Link
                to="/loop-wallet"
                aria-label="Loop wallet"
                className="w-10 h-10 rounded-full bg-card border border-border/60 flex items-center justify-center text-foreground/80 hover:border-primary/40 hover:text-primary transition-all"
              >
                <QrCode className="h-4 w-4" />
              </Link>
            )}
            {user ? (
              <Link
                to="/profile"
                aria-label="Profile"
                className="w-10 h-10 rounded-full bg-card border border-border/60 flex items-center justify-center text-foreground/80 hover:border-primary/40 hover:text-primary transition-all"
              >
                <UserCircle className="h-4 w-4" />
              </Link>
            ) : (
              <Link to="/auth">
                <Button size="sm" className="text-xs rounded-full h-10 px-4 gap-1.5 shadow-glow-blue">
                  <LogIn className="h-3.5 w-3.5" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="space-y-4 pb-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-36 rounded-3xl animate-pulse" />
              <Skeleton className="h-52 rounded-3xl animate-pulse" style={{ animationDelay: '100ms' }} />
              <Skeleton className="h-40 rounded-3xl animate-pulse" style={{ animationDelay: '200ms' }} />
            </div>
          ) : dailyDrop ? (
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
            <EmptyDailyDrop date={today} />
          )}

          {/* Discover Toledo quick card */}
          <Link
            to="/discover"
            className="group flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all"
          >
            <div className="w-11 h-11 rounded-2xl bg-primary/12 border border-primary/20 flex items-center justify-center">
              <Compass className="h-5 w-5 text-primary" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">Discover Toledo</p>
              <p className="text-[12px] text-muted-foreground">Browse all businesses & more</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>
      </div>
    </div>
  );
}
