import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBusinesses } from '@/hooks/useBusinesses';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import * as LucideIcons from 'lucide-react';
import { Search, UserCircle, ChevronRight } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import logoImage from '@/assets/tl-logo.png';

export default function Discover() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');

  const { data: businesses, isLoading } = useBusinesses();
  const { data: categories } = useCategories();

  const getIcon = (iconName?: string) => {
    if (!iconName) return LucideIcons.Building2;
    const name =
      iconName.charAt(0).toUpperCase() +
      iconName.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    return (LucideIcons as Record<string, any>)[name] || LucideIcons.Building2;
  };

  const browseCategories = useMemo(() => (categories || []).slice(0, 12), [categories]);

  const featured = useMemo(() => {
    const list = businesses || [];
    const f = list.filter((b) => b.featured);
    return (f.length ? f : list).slice(0, 8);
  }, [businesses]);

  const isFounding = (b: any) =>
    b?.is_founding_5 || b?.is_founding_50 || b?.founding_member || b?.tier === 'founding_5' || b?.tier === 'founding_50';

  const foundingLabel = (b: any) =>
    b?.is_founding_5 || b?.tier === 'founding_5' ? 'Founding 5' : 'Founding 50';

  return (
    <div className="min-h-screen pb-[calc(6rem+env(safe-area-inset-bottom))] bg-white text-slate-900">
      <SEOHead
        title="Discover | ToledoLokal"
        description="Discover the best local businesses, nonprofits and events in Toledo, Ohio."
        url="/discover"
      />

      <div className="px-4 pt-safe-top max-w-screen-sm mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between py-3">
          <Link to="/" className="flex items-center gap-1.5">
            <img src={logoImage} alt="ToledoLokal" className="w-8 h-8 object-contain" />
            <h1 className="text-[18px] font-bold tracking-tight text-slate-900">
              Toledo<span className="text-primary">Lokal</span>
            </h1>
          </Link>
          <div className="flex items-center gap-3">
            <button aria-label="Search" className="text-slate-700 hover:text-primary">
              <Search className="h-[18px] w-[18px]" strokeWidth={2} />
            </button>
            <Link to="/admin" className="text-[13px] font-semibold text-slate-700 hover:text-primary">
              Admin
            </Link>
            <Link
              to={user ? '/profile' : '/auth'}
              aria-label="Profile"
              className="w-8 h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500"
            >
              <UserCircle className="h-6 w-6" strokeWidth={1.5} />
            </Link>
          </div>
        </header>

        {/* Search */}
        <div className="relative mt-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search businesses..."
            className="w-full h-11 pl-10 pr-4 rounded-full bg-slate-100 border border-slate-200 text-[14px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary/40 focus:bg-white transition-all"
          />
        </div>

        {/* Browse Categories */}
        <div className="flex items-center justify-between mt-6 mb-3">
          <h2 className="text-[15px] font-bold text-slate-900">Browse Categories</h2>
          <span className="text-[12px] text-slate-500">
            {browseCategories.length} categor{browseCategories.length === 1 ? 'y' : 'ies'}
          </span>
        </div>

        {browseCategories.length === 0 ? (
          <EmptyLight message="No categories yet" />
        ) : (
          <div className="grid grid-cols-4 gap-2.5">
            {browseCategories.map((cat) => {
              const Icon = getIcon(cat.icon);
              return (
                <Link
                  key={cat.id}
                  to={`/explore?category=${cat.id}`}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/70 hover:border-primary/40 hover:bg-primary/5 transition-all"
                >
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                    <Icon className="h-[18px] w-[18px] text-primary" strokeWidth={1.8} />
                  </div>
                  <span className="text-[11.5px] font-semibold text-slate-700 text-center leading-tight line-clamp-2">
                    {cat.name}
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Featured This Week */}
        <div className="flex items-center justify-between mt-7 mb-3">
          <h2 className="text-[15px] font-bold text-slate-900">Featured This Week</h2>
          <Link to="/explore" className="flex items-center gap-0.5 text-[12.5px] font-semibold text-primary">
            View all
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="space-y-2.5">
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[88px] rounded-2xl bg-slate-100" />
            ))
          ) : featured.length ? (
            featured.map((biz) => {
              const cover =
                biz.cover_image_url ||
                (Array.isArray(biz.photos) && (biz.photos[0] as string)) ||
                biz.editor_pick_image;
              const catName = (biz.category as any)?.name as string | undefined;
              const neighborhood = (biz.neighborhood as any)?.name as string | undefined;
              const Icon = getIcon((biz.category as any)?.icon);
              return (
                <Link
                  key={biz.id}
                  to={`/business/${biz.id}`}
                  className="block rounded-2xl border border-slate-200 bg-white hover:border-primary/30 hover:shadow-sm transition-all overflow-hidden"
                >
                  <div className="flex items-center gap-3 p-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                      {cover ? (
                        <img src={cover as string} alt={biz.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <Icon className="h-6 w-6 text-slate-400" strokeWidth={1.6} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-[14.5px] text-slate-900 leading-tight truncate">
                          {biz.name}
                        </h3>
                        {isFounding(biz) && (
                          <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold">
                            {foundingLabel(biz)}
                          </span>
                        )}
                      </div>
                      <p className="text-[11.5px] text-slate-500 leading-tight mt-0.5 truncate">
                        {[catName, neighborhood].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  </div>
                  {biz.description && (
                    <div className="mx-3 mb-3 px-3 py-2 rounded-lg bg-primary/[0.06] border border-primary/10">
                      <p className="text-[12px] text-slate-700 line-clamp-1">{biz.description}</p>
                    </div>
                  )}
                </Link>
              );
            })
          ) : (
            <EmptyLight message="No featured businesses yet" />
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyLight({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center text-slate-500 text-[12.5px]">
      {message}
    </div>
  );
}
