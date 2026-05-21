import { useNavigate } from 'react-router-dom';
import { ChevronRight, Heart, Users } from 'lucide-react';
import heroSkyline from '@/assets/hero-toledo-skyline.jpg';

interface HeroSectionProps {
  onSearch: (query: string, filters: { neighborhood?: string; category?: string }) => void;
}

/**
 * Hero — cinematic Toledo skyline with "TOLEDO IS / BUILT / TOGETHER." headline,
 * descriptive copy, primary CTA, and two stacked glass info cards on the right.
 * Matches the "Discover" mockup.
 */
export function HeroSection({ onSearch: _onSearch }: HeroSectionProps) {
  const navigate = useNavigate();

  return (
    <section className="px-4 pt-3">
      <div className="relative w-full overflow-hidden rounded-3xl border border-border/60 shadow-soft-xl h-[420px]">
        {/* Photo backdrop */}
        <img
          src={heroSkyline}
          alt="Toledo skyline at dusk"
          width={1280}
          height={896}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Tonal overlays for legibility */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(180deg, hsl(220 40% 6% / 0.55) 0%, hsl(220 40% 6% / 0.25) 35%, hsl(220 40% 6% / 0.75) 100%),
              linear-gradient(90deg, hsl(220 40% 6% / 0.55) 0%, transparent 55%)
            `,
          }}
        />

        {/* Headline block */}
        <div className="relative h-full flex flex-col justify-between p-5">
          <div className="max-w-[62%]">
            <p className="text-[11px] font-bold tracking-[0.22em] text-primary/90 uppercase mb-2">
              Toledo is
            </p>
            <h1
              className="font-black uppercase text-white"
              style={{
                fontFamily: "'Anton', 'Plus Jakarta Sans', sans-serif",
                fontSize: 'clamp(2.75rem, 14vw, 4rem)',
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
            </h1>

            <p className="mt-4 text-white/85 text-[13px] leading-relaxed">
              Discover local businesses, nonprofits,<br />
              events and people making{' '}
              <span className="text-primary font-semibold">Toledo</span> better.
            </p>

            <button
              onClick={() => navigate('/explore')}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground font-semibold text-sm pl-5 pr-4 py-3 shadow-glow-blue hover:brightness-110 transition-all"
            >
              Explore Toledo
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Carousel dots */}
          <div className="flex items-center justify-center gap-1.5">
            <span className="h-1.5 w-4 rounded-full bg-primary" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
          </div>
        </div>

        {/* Stacked glass cards */}
        <div className="absolute top-1/2 -translate-y-1/2 right-3 flex flex-col gap-2.5 w-[44%] max-w-[180px]">
          <GlassCard
            icon={<Heart className="h-4 w-4 text-primary fill-primary/30" strokeWidth={2.2} />}
            title="Love Local"
            sub="Support the people who support Toledo."
          />
          <GlassCard
            icon={<Users className="h-4 w-4 text-primary" strokeWidth={2.2} />}
            title="Stronger Together"
            sub="Every connection makes an impact."
          />
        </div>
      </div>
    </section>
  );
}

function GlassCard({
  icon,
  title,
  sub,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/45 backdrop-blur-xl px-3 py-2.5 shadow-lg">
      <div className="flex items-start gap-2">
        <div className="w-7 h-7 shrink-0 rounded-full bg-primary/15 flex items-center justify-center">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[12px] font-bold text-white leading-tight">{title}</p>
          <p className="text-[10px] text-white/65 leading-snug mt-0.5">{sub}</p>
        </div>
      </div>
    </div>
  );
}
