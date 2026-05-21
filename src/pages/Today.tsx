import { lazy, Suspense, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import {
  Search,
  UserCircle,
  Sun,
  ChevronRight,
  Bookmark,
  Users,
  Star,
  Leaf,
  Music,
  Laugh,
  Disc3,
  ChevronDown,
} from 'lucide-react';
import logoImage from '@/assets/tl-logo.png';
import heroSkyline from '@/assets/hero-toledo-skyline.jpg';

const FirstVisitOnboarding = lazy(() =>
  import('@/components/onboarding/FirstVisitOnboarding').then((m) => ({
    default: m.FirstVisitOnboarding,
  })),
);

// ---------- mock data shaped like the mockup ----------
const happeningNow = [
  { id: 1, badge: 'LIVE NOW', badgeTone: 'green', title: 'Live on the Docks', place: 'Promenade Park', meta: 'Ends 10:00 PM', metaTone: 'green', tint: 'from-orange-300 via-amber-400 to-rose-500', emoji: '🎤' },
  { id: 2, badge: 'STARTS SOON', badgeTone: 'orange', title: 'Food Truck Rally', place: 'Hensville Park', meta: 'Starts 5:30 PM', metaTone: 'orange', tint: 'from-yellow-300 via-amber-400 to-orange-500', emoji: '🌮' },
  { id: 3, badge: 'HAPPENING', badgeTone: 'purple', title: 'Art Loop', place: 'Downtown Toledo', meta: 'Until 9:00 PM', metaTone: 'purple', tint: 'from-stone-200 via-stone-300 to-stone-400', emoji: '🖼️' },
  { id: 4, badge: 'RIGHT NOW', badgeTone: 'blue', title: 'New Menu Launch', place: 'Grindhrs Coffee Co.', meta: 'Just launched', metaTone: 'blue', tint: 'from-amber-100 via-orange-200 to-amber-300', emoji: '☕' },
];

const forYou = [
  { id: 1, title: 'Poetry Night at Finch & Fern', meta: '7:00 PM • Sylvania', chip: 'Because you like Bookstores', chipTone: 'violet', tint: 'from-amber-800 via-amber-900 to-stone-900', emoji: '📚' },
  { id: 2, title: 'Lavender Honey Latte is back 🤎', meta: 'Grindhrs Coffee Co.', chip: 'New for you', chipTone: 'amber', tint: 'from-stone-200 via-stone-300 to-stone-400', emoji: '☕' },
  { id: 3, title: 'Volunteer at Saturday Food Drive', meta: 'Food For Thought', chip: 'You care about this', chipTone: 'rose', tint: 'from-emerald-300 via-teal-400 to-emerald-500', emoji: '🤝' },
  { id: 4, title: 'New Plant Arrivals', meta: 'Plant House LLC', chip: "You've been here", chipTone: 'green', tint: 'from-green-300 via-emerald-400 to-emerald-500', emoji: '🪴' },
];

const timeline = [
  { time: '4:00 PM', title: 'Farmers Market 🍎', place: 'Warehouse District', Icon: Leaf, tone: 'bg-green-100 text-green-600' },
  { time: '6:00 PM', title: 'Live Music: Tyler Reddick 🎸', place: 'Ye Olde Durty Bird', Icon: Music, tone: 'bg-violet-100 text-violet-600' },
  { time: '7:30 PM', title: 'Comedy Show 😂', place: 'Toledo Funny Bone', Icon: Laugh, tone: 'bg-amber-100 text-amber-600' },
  { time: '9:00 PM', title: 'DJ Night 🕺', place: 'Registry Bistro', Icon: Disc3, tone: 'bg-pink-100 text-pink-600' },
];

const circle = [
  { id: 1, name: 'Anthony M.', action: 'Saved', target: 'Registry Bistro', when: '1h ago' },
  { id: 2, name: 'Sarah K.', action: 'Checked in to', target: 'Grindhrs Coffee Co.', when: '2h ago' },
  { id: 3, name: 'Food For Thought', action: 'Posted a volunteer', target: 'need', when: '3h ago' },
  { id: 4, name: 'Plant House LLC', action: 'New post:', target: 'New arrivals!', when: '4h ago' },
];

const picks = [
  { id: 1, title: 'Best Patio Spots', sub: 'Perfect for today', tint: 'from-amber-800 to-stone-700' },
  { id: 2, title: 'Hidden Gem', sub: 'The Attic on Adams', tint: 'from-amber-300 to-amber-500' },
  { id: 3, title: 'Support Local', sub: 'Boutique of the week', tint: 'from-stone-300 to-stone-500' },
  { id: 4, title: 'Weekend Guide', sub: 'Top 8 things to do', tint: 'from-orange-400 to-rose-500' },
];

const badgeToneClass: Record<string, string> = {
  green: 'bg-emerald-500 text-white',
  orange: 'bg-orange-500 text-white',
  purple: 'bg-violet-500 text-white',
  blue: 'bg-blue-500 text-white',
};
const metaToneClass: Record<string, string> = {
  green: 'text-emerald-600',
  orange: 'text-orange-600',
  purple: 'text-violet-600',
  blue: 'text-blue-600',
};
const chipToneClass: Record<string, string> = {
  violet: 'bg-violet-100 text-violet-700',
  amber: 'bg-amber-100 text-amber-700',
  rose: 'bg-rose-100 text-rose-700',
  green: 'bg-emerald-100 text-emerald-700',
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Today() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem('onboarding-completed'),
  );

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
            <Link
              to="/admin"
              className="h-9 px-4 rounded-full border border-border/70 text-[13px] font-semibold text-foreground/90 flex items-center hover:border-primary/50 hover:text-primary"
            >
              Admin
            </Link>
            <Link
              to={user ? '/profile' : '/auth'}
              aria-label="Profile"
              className="w-9 h-9 rounded-full flex items-center justify-center text-foreground/80 hover:text-primary"
            >
              <UserCircle className="h-7 w-7" strokeWidth={1.5} />
            </Link>
          </div>
        </header>

        {/* Hero greeting card */}
        <section className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-sky-100 to-blue-100 border border-sky-200/60 h-[180px]">
          <img
            src={heroSkyline}
            alt=""
            className="absolute right-0 top-0 h-full w-[58%] object-cover"
          />
          <div
            className="absolute right-0 top-0 h-full w-[58%]"
            style={{ background: 'linear-gradient(90deg, hsl(210 80% 92%) 0%, transparent 35%)' }}
          />
          <div className="relative h-full flex flex-col justify-between p-4">
            <div>
              <p className="text-[12px] text-foreground/70 font-medium">
                {greeting()}, Toledo! ☀️
              </p>
              <h2 className="mt-1 text-[22px] font-bold leading-[1.15] text-foreground max-w-[62%]">
                It's a beautiful day to support local.
              </h2>
            </div>
            <div className="inline-flex w-fit items-center gap-2 bg-white/90 backdrop-blur rounded-xl px-3 py-1.5 border border-white shadow-sm">
              <Sun className="h-5 w-5 text-amber-500 fill-amber-400" />
              <div className="leading-tight">
                <p className="text-[15px] font-bold text-foreground">
                  72° <span className="text-[11px] font-medium text-muted-foreground">Mostly Sunny <ChevronDown className="inline h-3 w-3" /></span>
                </p>
                <p className="text-[10px] text-muted-foreground -mt-0.5">Feels like 74°</p>
              </div>
            </div>
          </div>
        </section>

        {/* Happening Right Now */}
        <Section title="Happening Right Now" emoji="🔥" actionTo="/discover">
          <HScroll>
            {happeningNow.map((e) => (
              <article key={e.id} className="w-[150px] shrink-0 rounded-2xl border border-border/60 bg-card overflow-hidden">
                <div className={`relative h-[88px] bg-gradient-to-br ${e.tint}`}>
                  <span className={`absolute top-2 left-2 text-[9px] font-bold tracking-wide px-2 py-0.5 rounded-md ${badgeToneClass[e.badgeTone]}`}>
                    {e.badge}
                  </span>
                </div>
                <div className="p-2.5">
                  <p className="text-[12.5px] font-bold text-foreground leading-tight line-clamp-2">{e.title}</p>
                  <p className="mt-1 text-[10.5px] text-muted-foreground flex items-center gap-0.5">
                    <span className="inline-block">📍</span>{e.place}
                  </p>
                  <p className={`mt-1 text-[11px] font-semibold ${metaToneClass[e.metaTone]}`}>{e.meta}</p>
                </div>
              </article>
            ))}
          </HScroll>
        </Section>

        {/* For You Today */}
        <Section title="For You Today" emoji="✨" subtitle="Based on your favorites" action="Edit">
          <HScroll>
            {forYou.map((e) => (
              <article key={e.id} className="w-[155px] shrink-0 rounded-2xl border border-border/60 bg-card overflow-hidden">
                <div className={`relative h-[100px] bg-gradient-to-br ${e.tint}`}>
                  <button className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/95 flex items-center justify-center shadow-sm">
                    <Bookmark className="h-3.5 w-3.5 text-foreground/70" />
                  </button>
                </div>
                <div className="p-2.5">
                  <p className="text-[12.5px] font-bold text-foreground leading-tight line-clamp-2">{e.title}</p>
                  <p className="mt-1 text-[10.5px] text-muted-foreground">{e.meta}</p>
                  <span className={`mt-1.5 inline-block text-[10px] font-medium px-2 py-0.5 rounded-md ${chipToneClass[e.chipTone]}`}>
                    {e.chip}
                  </span>
                </div>
              </article>
            ))}
          </HScroll>
        </Section>

        {/* Neighborhood + Timeline */}
        <section className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border/60 bg-card p-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[13px] font-bold text-foreground">Neighborhood Energy</p>
                <p className="text-[10px] text-muted-foreground">Bee where the buzz is</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="relative mt-2 h-[150px] rounded-xl overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
              {/* river */}
              <div className="absolute inset-x-0 top-[55%] h-3 bg-blue-200/70 -rotate-6" />
              {/* heat spots */}
              <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-white text-[9px] font-semibold shadow-sm">
                Old West End <span className="block text-orange-500">🔥 Very Active</span>
              </div>
              <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-white text-[9px] font-semibold shadow-sm">
                Downtown <span className="block text-orange-500">🔥 Buzzing</span>
              </div>
              <div className="absolute bottom-3 left-2 px-2 py-1 rounded-lg bg-white text-[9px] font-semibold shadow-sm">
                Maumee <span className="block text-muted-foreground">😌 Calm</span>
              </div>
              <div className="absolute bottom-3 right-2 px-2 py-1 rounded-lg bg-white text-[9px] font-semibold shadow-sm">
                Perrysburg <span className="block text-muted-foreground">😌 Calm</span>
              </div>
              <div className="absolute top-[35%] left-[40%] w-10 h-10 rounded-full bg-orange-400/40 blur-md" />
              <div className="absolute top-[30%] left-[20%] w-8 h-8 rounded-full bg-red-400/40 blur-md" />
              <div className="absolute top-[40%] left-[60%] w-7 h-7 rounded-full bg-amber-300/50 blur-md" />
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-3">
            <p className="text-[13px] font-bold text-foreground">Today's Timeline</p>
            <p className="text-[10px] text-muted-foreground">Your day at a glance</p>
            <ul className="mt-2 space-y-2.5">
              {timeline.map((t, i) => (
                <li key={i} className="flex items-start gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${t.tone}`}>
                    <t.Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold text-muted-foreground">{t.time}</p>
                    <p className="text-[11.5px] font-semibold text-foreground leading-tight truncate">{t.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{t.place}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* From Your Circle */}
        <Section
          title="From Your Circle"
          icon={<Users className="h-4 w-4 text-foreground/70" />}
          subtitle="Friends, businesses & nonprofits you follow"
          actionTo="/pulse"
        >
          <HScroll>
            {circle.map((c) => (
              <article key={c.id} className="w-[180px] shrink-0 rounded-2xl border border-border/60 bg-card p-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-300 to-pink-300" />
                  <p className="text-[12px] font-bold text-foreground truncate">{c.name}</p>
                </div>
                <div className="mt-2 flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-foreground/80 leading-tight">{c.action}</p>
                    <p className="text-[11px] font-semibold text-foreground leading-tight truncate">{c.target}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{c.when}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-200 to-orange-300 shrink-0" />
                </div>
              </article>
            ))}
          </HScroll>
        </Section>

        {/* Toledo Lokal Picks */}
        <Section
          title="Toledo Lokal Picks"
          icon={<Star className="h-4 w-4 text-amber-500 fill-amber-400" />}
          subtitle="Handpicked for today"
          actionTo="/discover"
        >
          <HScroll>
            {picks.map((p) => (
              <article
                key={p.id}
                className={`relative w-[155px] h-[120px] shrink-0 rounded-2xl overflow-hidden bg-gradient-to-br ${p.tint}`}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 text-white">
                  <p className="text-[13px] font-bold leading-tight">{p.title}</p>
                  <p className="text-[10.5px] opacity-90 leading-tight">{p.sub}</p>
                </div>
              </article>
            ))}
          </HScroll>
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  emoji,
  icon,
  subtitle,
  action,
  actionTo,
  children,
}: {
  title: string;
  emoji?: string;
  icon?: React.ReactNode;
  subtitle?: string;
  action?: string;
  actionTo?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5">
      <div className="flex items-end justify-between mb-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            {emoji && <span className="text-base leading-none">{emoji}</span>}
            {icon}
            <h3 className="text-[15px] font-bold text-foreground">{title}</h3>
            {subtitle && (
              <span className="text-[11px] text-muted-foreground font-medium ml-1 truncate">
                {subtitle}
              </span>
            )}
          </div>
        </div>
        {actionTo ? (
          <Link to={actionTo} className="text-[12px] font-semibold text-primary shrink-0">
            View all
          </Link>
        ) : action ? (
          <button className="text-[12px] font-semibold text-primary shrink-0">{action}</button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function HScroll({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
      <div className="flex gap-2.5 pb-1">{children}</div>
    </div>
  );
}
