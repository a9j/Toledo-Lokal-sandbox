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
import { QrCode, Compass, ChevronRight, UserCircle, LogIn, Heart, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoImage from '@/assets/tl-logo.png';
import heroSkyline from '@/assets/hero-toledo-skyline.jpg';

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
            <Link
              to="/loop-wallet"
              aria-label="Loop wallet"
              className="w-10 h-10 rounded-full bg-card border border-border/60 flex items-center justify-center text-foreground/80 hover:border-primary/40 hover:text-primary transition-all"
            >
              <QrCode className="h-4 w-4" />
            </Link>
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

        {/* Cinematic Toledo hero */}
        <section className="pb-4">
          <div className="relative w-full overflow-hidden rounded-3xl border border-border/60 shadow-soft-xl h-[300px] sm:h-[360px]">
            <img
              src={heroSkyline}
              alt="Downtown Toledo"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(180deg, hsl(220 40% 6% / 0.35) 0%, hsl(220 40% 6% / 0.55) 55%, hsl(220 40% 6% / 0.92) 100%)`,
              }}
            />

            <div className="relative h-full flex flex-col justify-end p-4">
              <p className="text-[10px] font-bold tracking-[0.22em] text-primary/90 uppercase mb-1.5">
                Toledo is
              </p>
              <h2
                className="font-black uppercase text-white"
                style={{
                  fontFamily: "'Anton', 'Plus Jakarta Sans', sans-serif",
                  fontSize: 'clamp(2.25rem, 11vw, 3.5rem)',
                  lineHeight: 0.88,
                  letterSpacing: '-0.01em',
                }}
              >
                <span className="block">Built</span>
                <span className="relative inline-block text-primary">
                  Together.
                  <svg
                    className="absolute -bottom-1 left-0 w-full"
                    viewBox="0 0 200 12"
                    preserveAspectRatio="none"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M2 8 Q 50 2, 100 6 T 198 4"
                      stroke="hsl(var(--primary))"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h2>
              <p className="mt-3 text-white/85 text-[12.5px] leading-relaxed max-w-[90%]">
                Discover local businesses, nonprofits, events and people making{' '}
                <span className="text-primary font-semibold">Toledo</span> better.
              </p>
              <Link
                to="/discover"
                className="mt-3 inline-flex w-fit items-center gap-2 rounded-full bg-primary text-primary-foreground font-semibold text-[13px] pl-4 pr-3 py-2.5 shadow-glow-blue hover:brightness-110 transition-all"
              >
                Explore Toledo
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Value props — compact row beneath hero */}
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl border border-border/60 bg-card px-3 py-2.5">
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 shrink-0 rounded-full bg-primary/15 flex items-center justify-center">
                  <Heart className="h-3.5 w-3.5 text-primary fill-primary/30" strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-foreground leading-tight">Love Local</p>
                  <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">Support who supports Toledo.</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card px-3 py-2.5">
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 shrink-0 rounded-full bg-primary/15 flex items-center justify-center">
                  <Users className="h-3.5 w-3.5 text-primary" strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-foreground leading-tight">Stronger Together</p>
                  <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">Every connection counts.</p>
                </div>
              </div>
            </div>
          </div>
        </section>


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
