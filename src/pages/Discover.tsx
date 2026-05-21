import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBusinesses } from '@/hooks/useBusinesses';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import * as LucideIcons from 'lucide-react';
import {
  Search,
  ChevronRight,
  Heart,
  MapPin,
  Bookmark,
  UserCircle,
  ArrowUpRight,
} from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import logoImage from '@/assets/tl-logo.png';
import heroSkyline from '@/assets/hero-toledo-skyline.jpg';

const NONPROFIT_KEYWORDS = ['nonprofit', 'non-profit', 'charity', 'mission'];

export default function Discover() {
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const { data: businesses, isLoading } = useBusinesses();
  const { data: categories } = useCategories();

  const getIcon = (iconName?: string) => {
    if (!iconName) return LucideIcons.Building2;
    const name =
      iconName.charAt(0).toUpperCase() +
      iconName.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    return (LucideIcons as Record<string, any>)[name] || LucideIcons.Building2;
  };

  const featured = useMemo(
    () => (businesses || []).filter((b) => b.featured).slice(0, 8),
    [businesses],
  );

  const nonprofit = useMemo(() => {
    const list = businesses || [];
    return list.find((b) => {
      const cat = ((b.category as any)?.name || '').toLowerCase();
      const desc = (b.description || '').toLowerCase();
      return NONPROFIT_KEYWORDS.some((k) => cat.includes(k) || desc.includes(k));
    });
  }, [businesses]);

  const trending = useMemo(() => {
    const list = (businesses || []).filter((b) => b.id !== nonprofit?.id && !b.featured);
    return list.slice(0, 6);
  }, [businesses, nonprofit]);

  const topCategories = useMemo(() => (categories || []).slice(0, 8), [categories]);

  const toggleSave = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div
      className="min-h-screen pb-[calc(6rem+env(safe-area-inset-bottom))] text-white"
      style={{ backgroundColor: 'hsl(222 47% 6%)' }}
    >
      <SEOHead
        title="Discover | ToledoLokal"
        description="Discover the best local businesses, nonprofits and events in Toledo, Ohio."
        url="/discover"
      />

      <div className="px-4 pt-safe-top max-w-screen-sm mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between py-3">
          <Link to="/" className="flex items-center gap-1">
            <img src={logoImage} alt="ToledoLokal" className="w-9 h-9 object-contain" />
            <h1 className="text-[19px] font-bold tracking-tight text-white">
              Toledo<span className="text-primary">Lokal</span>
            </h1>
          </Link>
          <div className="flex items-center gap-2">
            <button
              aria-label="Search"
              className="w-9 h-9 flex items-center justify-center text-white/85 hover:text-primary"
            >
              <Search className="h-[18px] w-[18px]" strokeWidth={2} />
            </button>
            <Link
              to={user ? '/profile' : '/auth'}
              aria-label="Profile"
              className="w-9 h-9 rounded-full overflow-hidden border border-white/20 bg-white/5 flex items-center justify-center text-white/80"
            >
              <UserCircle className="h-7 w-7" strokeWidth={1.4} />
            </Link>
          </div>
        </header>

        {/* Hero */}
        <section className="relative rounded-3xl overflow-hidden border border-white/10 h-[360px] mt-1">
          <img
            src={heroSkyline}
            alt="Toledo skyline at sunset"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, hsl(222 47% 6% / 0.25) 0%, hsl(222 47% 6% / 0.55) 55%, hsl(222 47% 6% / 0.95) 100%)',
            }}
          />
          <div className="relative h-full flex flex-col justify-end p-5">
            <h2
              className="font-black uppercase text-white leading-[0.88] tracking-tight"
              style={{
                fontFamily: "'Anton', 'Plus Jakarta Sans', sans-serif",
                fontSize: 'clamp(2.4rem, 11.5vw, 3.4rem)',
              }}
            >
              <span className="block">Discover</span>
              <span className="block">The Best Of</span>
              <span
                className="block text-primary mt-1"
                style={{
                  fontFamily: "'Dancing Script', cursive",
                  fontWeight: 700,
                  textTransform: 'none',
                  fontSize: '1.05em',
                  lineHeight: 1,
                }}
              >
                Toledo
              </span>
            </h2>
            <p className="mt-3 text-white/85 text-[13px] leading-snug max-w-[80%]">
              Support local businesses, nonprofits, events and more.
            </p>
            <Link
              to="/near-me"
              className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-primary text-primary-foreground font-semibold text-[13.5px] pl-5 pr-4 py-3 shadow-glow-blue hover:brightness-110 transition-all"
            >
              Explore Near Me
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Explore Categories */}
        <SectionHeader title="EXPLORE CATEGORIES" to="/explore" />
        <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 pb-2">
            {(topCategories.length ? topCategories : Array(6).fill(null)).map((cat, i) => {
              const Icon = getIcon(cat?.icon);
              return (
                <Link
                  key={cat?.id || i}
                  to={cat ? `/explore?category=${cat.id}` : '/explore'}
                  className="flex flex-col items-center gap-2 shrink-0 w-[76px]"
                >
                  <div className="w-14 h-14 rounded-full border border-white/15 bg-white/[0.04] flex items-center justify-center hover:border-primary/50 transition-all">
                    <Icon className="h-6 w-6 text-primary" strokeWidth={1.6} />
                  </div>
                  <span className="text-[11px] font-medium text-white/85 text-center leading-tight line-clamp-2 w-full">
                    {cat?.name || '—'}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Featured This Week */}
        <SectionHeader title="FEATURED THIS WEEK" to="/explore" />
        <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 pb-2 snap-x snap-mandatory">
            {isLoading
              ? [1, 2, 3].map((i) => (
                  <Skeleton key={i} className="w-[78%] h-[280px] rounded-2xl bg-white/5 shrink-0" />
                ))
              : featured.length
              ? featured.map((biz) => {
                  const cover =
                    biz.cover_image_url ||
                    (Array.isArray(biz.photos) && (biz.photos[0] as string)) ||
                    biz.editor_pick_image ||
                    heroSkyline;
                  const catName = ((biz.category as any)?.name || 'Local').toUpperCase();
                  const badge = catName.includes('EVENT')
                    ? 'EVENT'
                    : catName.includes('SHOP') || catName.includes('RETAIL')
                    ? 'NEW'
                    : 'LOCAL BUSINESS';
                  const saved = savedIds.has(biz.id);
                  return (
                    <Link
                      key={biz.id}
                      to={`/business/${biz.id}`}
                      className="snap-start shrink-0 w-[78%] rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03]"
                    >
                      <div className="relative h-44 bg-black/40 overflow-hidden">
                        <img
                          src={cover as string}
                          alt={biz.name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold tracking-wide uppercase">
                          {badge}
                        </span>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-[15px] text-white leading-tight line-clamp-1">
                          {biz.name}
                        </h3>
                        {biz.description && (
                          <p className="mt-1 text-[12px] text-white/65 leading-snug line-clamp-2">
                            {biz.description}
                          </p>
                        )}
                        <div className="mt-2 flex items-center justify-between">
                          {(biz.neighborhood as any)?.name ? (
                            <div className="flex items-center gap-1 text-[11px] text-white/55">
                              <MapPin className="h-3 w-3" />
                              {(biz.neighborhood as any).name}
                            </div>
                          ) : (
                            <span />
                          )}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              toggleSave(biz.id);
                            }}
                            aria-label="Save"
                            className="w-8 h-8 rounded-full flex items-center justify-center text-primary hover:bg-primary/10"
                          >
                            <Heart
                              className={`h-4 w-4 ${saved ? 'fill-primary' : ''}`}
                              strokeWidth={2}
                            />
                          </button>
                        </div>
                      </div>
                    </Link>
                  );
                })
              : (
                <EmptyDark message="No featured businesses yet" />
              )}
          </div>
        </div>

        {/* Support Toledo Nonprofits */}
        <SectionHeader title="SUPPORT TOLEDO NONPROFITS" to="/explore?type=nonprofit" />
        {nonprofit ? (
          <Link
            to={`/business/${nonprofit.id}`}
            className="block relative rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03]"
          >
            <div className="relative h-[200px]">
              <img
                src={
                  (nonprofit.cover_image_url ||
                    (Array.isArray(nonprofit.photos) && (nonprofit.photos[0] as string)) ||
                    heroSkyline) as string
                }
                alt={nonprofit.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(90deg, hsl(222 47% 6% / 0.2) 0%, hsl(222 47% 6% / 0.85) 60%, hsl(222 47% 6%) 100%)',
                }}
              />
              <div className="relative h-full flex flex-col justify-center p-5 ml-auto w-[58%]">
                <h3 className="text-[20px] font-bold text-white leading-tight">{nonprofit.name}</h3>
                {nonprofit.description && (
                  <p className="mt-1 text-[12.5px] text-white/75 line-clamp-2">
                    {nonprofit.description}
                  </p>
                )}
                <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary text-primary-foreground font-semibold text-[13px] px-4 py-2 shadow-glow-blue">
                  Learn More
                </span>
              </div>
            </div>
          </Link>
        ) : (
          <EmptyDark message="No nonprofits to feature yet" />
        )}

        {/* New & Trending */}
        <SectionHeader title="NEW & TRENDING" to="/explore" />
        <div className="space-y-2.5">
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-2xl bg-white/5" />
            ))
          ) : trending.length ? (
            trending.slice(0, 3).map((biz) => {
              const cover =
                biz.cover_image_url ||
                (Array.isArray(biz.photos) && (biz.photos[0] as string)) ||
                biz.editor_pick_image ||
                heroSkyline;
              const saved = savedIds.has(biz.id);
              const tagLabel = biz.featured
                ? 'Trending Now'
                : (biz.neighborhood as any)?.name
                ? `New in ${(biz.neighborhood as any).name}`
                : 'Popular';
              return (
                <Link
                  key={biz.id}
                  to={`/business/${biz.id}`}
                  className="flex items-center gap-3 p-2 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-primary/30 transition-all"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-black/40 shrink-0">
                    <img src={cover as string} alt={biz.name} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-white leading-tight truncate">{biz.name}</p>
                    <p className="text-[11px] font-semibold text-primary leading-tight">{tagLabel}</p>
                    {biz.description && (
                      <p className="text-[11px] text-white/60 leading-tight truncate">{biz.description}</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      toggleSave(biz.id);
                    }}
                    aria-label="Save"
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-primary hover:bg-primary/10"
                  >
                    <Bookmark className={`h-4 w-4 ${saved ? 'fill-primary' : ''}`} />
                  </button>
                </Link>
              );
            })
          ) : (
            <EmptyDark message="Nothing trending yet" />
          )}
        </div>

        {/* Love Where You Live CTA */}
        <section className="mt-6">
          <div
            className="relative rounded-2xl overflow-hidden border border-primary/40 p-5"
            style={{
              background:
                'linear-gradient(135deg, hsl(217 92% 30%) 0%, hsl(217 92% 18%) 100%)',
            }}
          >
            <h3 className="text-[17px] font-bold text-white leading-tight">LOVE WHERE YOU LIVE</h3>
            <p className="mt-1 text-[12.5px] text-white/80 max-w-[62%] leading-snug">
              Share your favorites and help our community grow.
            </p>
            <Link
              to={user ? '/pulse?create=1' : '/auth'}
              className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary text-primary-foreground font-semibold text-[12.5px] px-4 py-2 shadow-glow-blue"
            >
              Create a Post
            </Link>
            <div className="absolute right-2 bottom-2 w-[38%] h-[110px] opacity-90">
              <img
                src={heroSkyline}
                alt=""
                className="w-full h-full object-cover rounded-xl border border-white/15"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionHeader({ title, to }: { title: string; to: string }) {
  return (
    <div className="flex items-center justify-between mt-6 mb-3">
      <h2 className="text-[13px] font-bold text-white tracking-[0.14em]">{title}</h2>
      <Link to={to} className="flex items-center gap-0.5 text-[12px] font-semibold text-primary">
        View all
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function EmptyDark({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] py-8 text-center text-white/55 text-[12.5px]">
      {message}
    </div>
  );
}
