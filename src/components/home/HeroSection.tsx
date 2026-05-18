import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface HeroSectionProps {
  onSearch: (query: string, filters: { neighborhood?: string; category?: string }) => void;
}

/**
 * Editorial civic hero — cinematic full-width image slot, serif headline,
 * three elegant CTAs. The image slot is a deep gradient placeholder; real
 * Toledo photos / video can be dropped into `bg-[url(...)]` later.
 */
export function HeroSection({ onSearch }: HeroSectionProps) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  return (
    <section className="relative w-full overflow-hidden">
      {/* Cinematic media slot — replace background with real Toledo imagery/video */}
      <div className="relative min-h-[640px] flex flex-col justify-end">
        {/* Placeholder backdrop: layered gradients that evoke Toledo at dusk */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(120% 80% at 80% 20%, hsl(36 66% 28% / 0.55) 0%, transparent 55%), radial-gradient(100% 80% at 10% 90%, hsl(208 75% 24% / 0.45) 0%, transparent 60%), linear-gradient(180deg, hsl(213 30% 9%) 0%, hsl(213 28% 6%) 100%)',
            }}
          />
          {/* Subtle film grain via SVG noise */}
          <div
            className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E\")",
            }}
          />
          {/* Dark cinematic overlay */}
          <div className="absolute inset-0 cinematic-overlay" />
        </div>

        {/* Content */}
        <div className="relative px-6 pt-24 pb-12 max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-soft" />
            <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-foreground/80">
              The Glass City · Today
            </span>
          </div>

          <h1
            className="font-normal text-foreground mb-5 tracking-tight"
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontSize: 'clamp(2.75rem, 9vw, 4.5rem)',
              lineHeight: 1.02,
              letterSpacing: '-0.02em',
            }}
          >
            Toledo <span className="italic text-primary">Lokal</span>
          </h1>

          <p className="text-foreground/75 text-base md:text-lg leading-relaxed max-w-md mx-auto mb-10 font-light">
            The heartbeat of Toledo&rsquo;s local economy &mdash;
            <span className="text-foreground/90"> stories, neighborhoods, and the people who make this city.</span>
          </p>

          {/* Elegant CTA stack */}
          <div className="flex flex-col items-stretch gap-3 max-w-sm mx-auto">
            <button
              onClick={() => navigate('/auth')}
              className="group relative overflow-hidden rounded-full px-7 py-4 text-sm font-semibold tracking-wide bg-primary text-primary-foreground transition-all duration-300 hover:shadow-[0_0_40px_-8px_hsl(var(--primary)/0.6)]"
            >
              <span className="relative z-10 inline-flex items-center justify-center gap-2">
                Join the Founding Thousand
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/explore')}
                className="rounded-full px-5 py-3.5 text-sm font-medium border border-white/15 bg-white/5 backdrop-blur-md text-foreground/90 hover:bg-white/10 hover:border-white/25 transition-all"
              >
                Neighborhoods
              </button>
              <button
                onClick={() => navigate('/today')}
                className="rounded-full px-5 py-3.5 text-sm font-medium border border-white/15 bg-white/5 backdrop-blur-md text-foreground/90 hover:bg-white/10 hover:border-white/25 transition-all"
              >
                Tonight in Toledo
              </button>
            </div>
          </div>

          {/* Subtle search affordance — editorial, not the focal point */}
          <div className="mt-10 max-w-md mx-auto">
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40 group-focus-within:text-primary transition-colors" />
              <Input
                type="text"
                placeholder="Search a place, neighborhood, story…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearch(query, {})}
                className="h-12 pl-12 pr-4 rounded-full bg-white/[0.04] border-white/10 text-sm text-foreground placeholder:text-foreground/40 backdrop-blur-md focus-visible:ring-primary/40 focus-visible:border-primary/40"
              />
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-4 text-[11px] text-foreground/50 tracking-wide">
              <MapPin className="h-3 w-3" />
              <span>Toledo, Ohio &middot; Glass City</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
