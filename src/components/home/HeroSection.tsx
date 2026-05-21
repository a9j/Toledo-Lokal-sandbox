import { useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, HeartHandshake, CalendarDays, Tag } from 'lucide-react';

interface HeroSectionProps {
  onSearch: (query: string, filters: { neighborhood?: string; category?: string }) => void;
}

/**
 * Civic hero — bold "TOLEDO IS BUILT TOGETHER" headline over a cinematic
 * Toledo skyline placeholder, plus a glassy quick-actions card.
 *
 * To swap in a real skyline photo, replace the gradient div with a real
 * <img>/<video> behind the same overlay.
 */
export function HeroSection({ onSearch: _onSearch }: HeroSectionProps) {
  const navigate = useNavigate();

  const quickActions = [
    { icon: Building2, label: 'Businesses', sub: 'Shop local', to: '/explore' },
    { icon: HeartHandshake, label: 'Nonprofits', sub: 'Make an impact', to: '/community' },
    { icon: CalendarDays, label: 'Events', sub: "What's happening", to: '/events' },
    { icon: Tag, label: 'Deals', sub: 'Local rewards', to: '/deals' },
  ];

  return (
    <section className="relative w-full">
      {/* Skyline media slot */}
      <div className="relative h-[420px] sm:h-[460px] overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(120% 80% at 78% 32%, hsl(28 90% 48% / 0.42) 0%, transparent 55%),
              radial-gradient(80% 60% at 95% 70%, hsl(20 80% 38% / 0.38) 0%, transparent 60%),
              radial-gradient(70% 50% at 15% 85%, hsl(220 70% 22% / 0.55) 0%, transparent 65%),
              linear-gradient(180deg, hsl(220 35% 8%) 0%, hsl(220 30% 5%) 100%)
            `,
          }}
        />
        {/* Sketched skyline silhouette */}
        <svg
          className="absolute bottom-0 left-0 w-full h-[55%] opacity-90"
          viewBox="0 0 800 300"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="skyline" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(220 40% 14%)" />
              <stop offset="100%" stopColor="hsl(220 35% 6%)" />
            </linearGradient>
          </defs>
          <path
            fill="url(#skyline)"
            d="M0,300 L0,210 L40,210 L40,170 L75,170 L75,195 L110,195 L110,140 L140,140 L140,165 L175,165 L175,120 L210,120 L210,90 L240,90 L240,135 L275,135 L275,105 L310,105 L310,85 L340,85 L340,140 L380,140 L380,115 L420,115 L420,80 L445,80 L445,110 L475,110 L475,150 L510,150 L510,125 L545,125 L545,170 L575,170 L575,140 L610,140 L610,180 L645,180 L645,155 L680,155 L680,195 L720,195 L720,170 L760,170 L760,210 L800,210 L800,300 Z"
          />
        </svg>
        {/* Film grain */}
        <div
          className="absolute inset-0 opacity-[0.06] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.7'/%3E%3C/svg%3E\")",
          }}
        />
        {/* Bottom fade into page */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background" />

        {/* Headline */}
        <div className="relative h-full flex flex-col justify-end px-5 pb-16 max-w-lg mx-auto">
          <h1
            className="font-black uppercase tracking-tight text-foreground"
            style={{
              fontFamily: "'Anton', 'Plus Jakarta Sans', sans-serif",
              fontSize: 'clamp(2.5rem, 12vw, 4rem)',
              lineHeight: 0.92,
              letterSpacing: '-0.01em',
            }}
          >
            <span className="block">Toledo is</span>
            <span className="block">
              Built{' '}
              <span className="relative inline-block text-primary">
                Together.
                <svg
                  className="absolute -bottom-1 left-0 w-full"
                  viewBox="0 0 200 12"
                  preserveAspectRatio="none"
                  fill="none"
                >
                  <path
                    d="M2 8 Q 50 2, 100 6 T 198 4"
                    stroke="hsl(var(--primary))"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </span>
          </h1>
          <p className="mt-5 text-foreground/75 text-[15px] leading-relaxed max-w-[22rem]">
            Discover local businesses, nonprofits, events and the people making{' '}
            <span className="text-primary font-semibold">Toledo</span> better.
          </p>
        </div>
      </div>

      {/* Floating quick actions card */}
      <div className="px-4 -mt-10 relative z-10 max-w-lg mx-auto">
        <div className="rounded-3xl bg-card/85 backdrop-blur-xl border border-border/60 shadow-soft-xl p-3 grid grid-cols-4 divide-x divide-border/50">
          {quickActions.map(({ icon: Icon, label, sub, to }) => (
            <button
              key={label}
              onClick={() => navigate(to)}
              className="flex flex-col items-center gap-1.5 px-1 py-3 group active:scale-95 transition-transform"
            >
              <div className="w-9 h-9 rounded-full bg-primary/12 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Icon className="h-[18px] w-[18px] text-primary" strokeWidth={2.2} />
              </div>
              <span className="text-[12px] font-semibold text-foreground leading-none">{label}</span>
              <span className="text-[10px] text-muted-foreground leading-tight text-center">{sub}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => navigate('/explore')}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground font-semibold text-sm py-3.5 shadow-glow-blue hover:brightness-110 transition-all"
        >
          Explore Toledo
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
