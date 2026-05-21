import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Flame, Heart, Calendar, Tag } from 'lucide-react';

const filters = [
  { id: 'popular', label: 'Popular Businesses', icon: Flame, to: '/explore?sort=popular' },
  { id: 'nonprofits', label: 'Top Nonprofits', icon: Heart, to: '/community' },
  { id: 'weekend', label: 'This Weekend', icon: Calendar, to: '/events?when=weekend' },
  { id: 'deals', label: 'Best Deals', icon: Tag, to: '/deals' },
];

export function TrendingPills() {
  const [active, setActive] = useState('popular');

  return (
    <section className="px-4 py-6">
      <div className="flex items-end justify-between mb-3">
        <h2 className="text-xl font-bold text-foreground">Trending Now</h2>
        <Link
          to="/explore"
          className="flex items-center gap-0.5 text-sm font-semibold text-primary hover:underline"
        >
          View all
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {filters.map(({ id, label, icon: Icon, to }) => {
          const isActive = active === id;
          return (
            <Link
              key={id}
              to={to}
              onClick={() => setActive(id)}
              className={
                'shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold border transition-all ' +
                (isActive
                  ? 'bg-primary text-primary-foreground border-primary shadow-glow-blue'
                  : 'bg-card text-foreground/85 border-border/60 hover:border-primary/40')
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
