import { lazy, Suspense, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { parseISO, isToday as dateFnsIsToday } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDailyDrop } from '@/hooks/useDailyDrop';
import { DailyDropHeader } from '@/components/today/DailyDropHeader';
import { TodayInToledo } from '@/components/today/TodayInToledo';
import { LiveLocalSpotlight } from '@/components/today/LiveLocalSpotlight';
import { CommunityMoment } from '@/components/today/CommunityMoment';
import { EmptyDailyDrop } from '@/components/today/EmptyDailyDrop';
import { SEOHead } from '@/components/seo/SEOHead';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Search, UserCircle, Sun, Compass, ChevronRight, LogIn } from 'lucide-react';
import logoImage from '@/assets/tl-logo.png';
import heroSkyline from '@/assets/hero-toledo-skyline.jpg';

const FirstVisitOnboarding = lazy(() =>
  import('@/components/onboarding/FirstVisitOnboarding').then((m) => ({
    default: m.FirstVisitOnboarding,
  })),
);

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Today() {
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem('onboarding-completed'),
  );
  const today = new Date();
  const { data: dailyDrop, isLoading } = useDailyDrop(today);

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

  const isStale = dailyDrop && !dateFnsIsToday(parseISO(dailyDrop.drop_date));

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      localStorage.setItem('onboarding-completed', 'true');
      setShowOnboarding(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user && profile) {
      if (profile.role_selected === false) navigate('/role-select', { replace: true });
      else if (profile.profile_completed === false) navigate('/profile-setup', { replace: true });
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
    <div className="min-h-screen bg-background pb-[calc(6rem+env(safe-area-inset-bottom))]">
      <SEOHead
        title="Today | ToledoLokal"
        description="Your daily edition of Toledo — events, businesses, and community moments"
        url="/"
      />

      <div className="px-4 pt-safe-top max-w-screen-sm mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between py-3">
          <Link to="/" className="flex items-center gap-1">
            <img src={logoImage} alt="ToledoLokal" className="w-9 h-9 object-contain" />
            <h1 className="text-[19px] font-bold text-foreground tracking-tight">
              Toledo<span className="text-primary">Lokal</span>
            </h1>
          </Link>
          <div className="flex items-center gap-2">
            <button
              aria-label="Search"
              className="w-9 h-9 flex items-center justify-center text-foreground/80 hover:text-primary"
              onClick={() => navigate('/discover')}
            >
              <Search className="h-[18px] w-[18px]" strokeWidth={2} />
            </button>
            {isAdmin && (
              <Link
                to="/admin"
                className="h-9 px-4 rounded-full border border-border/70 text-[13px] font-semibold text-foreground/90 flex items-center hover:border-primary/50 hover:text-primary"
              >
                Admin
              </Link>
            )}
            {user ? (
              <Link
                to="/profile"
                aria-label="Profile"
                className="w-9 h-9 rounded-full flex items-center justify-center text-foreground/80 hover:text-primary"
              >
                <UserCircle className="h-7 w-7" strokeWidth={1.5} />
              </Link>
            ) : (
              <Link to="/auth">
                <Button size="sm" className="text-xs rounded-full h-9 px-3 gap-1.5">
                  <LogIn className="h-3.5 w-3.5" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </header>

        {/* Greeting hero card */}
        <section className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/15 h-[180px]">
          <img
            src={heroSkyline}
            alt=""
            className="absolute right-0 top-0 h-full w-[58%] object-cover"
          />
          <div
            className="absolute right-0 top-0 h-full w-[58%]"
            style={{ background: 'linear-gradient(90deg, hsl(var(--background)) 0%, transparent 35%)' }}
          />
          <div className="relative h-full flex flex-col justify-between p-4">
            <div>
              <p className="text-[12px] text-foreground/70 font-medium">
                {greeting()}, Toledo!
              </p>
              <h2 className="mt-1 text-[22px] font-bold leading-[1.15] text-foreground max-w-[62%]">
                It's a beautiful day to support local.
              </h2>
            </div>
            <div className="inline-flex w-fit items-center gap-2 bg-card/95 backdrop-blur rounded-xl px-3 py-1.5 border border-border shadow-sm">
              <Sun className="h-5 w-5 text-primary" />
              <div className="leading-tight">
                <p className="text-[13px] font-bold text-foreground">Toledo, OH</p>
                <p className="text-[10px] text-muted-foreground -mt-0.5">Your daily edition</p>
              </div>
            </div>
          </div>
        </section>

        {/* Daily Drop content */}
        <div className="mt-5 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-36 rounded-2xl" />
              <Skeleton className="h-48 rounded-2xl" />
              <Skeleton className="h-40 rounded-2xl" />
            </div>
          ) : dailyDrop ? (
            <>
              <DailyDropHeader
                date={parseISO(dailyDrop.drop_date)}
                title={dailyDrop.title}
                isStale={!!isStale}
              />
              {dailyDrop.highlights.length > 0 && (
                <TodayInToledo highlights={dailyDrop.highlights} />
              )}
              {dailyDrop.spotlights.length > 0 && (
                <LiveLocalSpotlight spotlights={dailyDrop.spotlights} />
              )}
              {dailyDrop.moment && <CommunityMoment moment={dailyDrop.moment} />}
            </>
          ) : (
            <EmptyDailyDrop date={today} />
          )}

          {/* Discover quick link */}
          <Link
            to="/discover"
            className="group flex items-center gap-3 p-4 rounded-2xl bg-card border border-border hover:border-primary/40 hover:bg-primary/5 transition-all"
          >
            <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Compass className="h-5 w-5 text-primary" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">Discover Toledo</p>
              <p className="text-[12px] text-muted-foreground">Browse businesses, nonprofits & events</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>
      </div>
    </div>
  );
}
