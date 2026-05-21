import { Link } from 'react-router-dom';
import { MapPin, ChevronRight, Store, Truck, Heart } from 'lucide-react';
import { SecureImage } from '@/components/ui/secure-image';
import { DailyDropSpotlight } from '@/hooks/useDailyDrop';

const TYPE_LABEL: Record<string, { label: string; icon: any }> = {
  business: { label: 'FEATURED BUSINESS', icon: Store },
  food_truck: { label: 'FOOD TRUCK', icon: Truck },
  nonprofit: { label: 'NONPROFIT', icon: Heart },
};

interface LiveLocalSpotlightProps {
  spotlights: DailyDropSpotlight[];
}

export function LiveLocalSpotlight({ spotlights }: LiveLocalSpotlightProps) {
  if (!spotlights.length) return null;

  return (
    <div className="rounded-3xl border border-border/60 bg-card overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <h2 className="text-[11px] font-bold tracking-[0.22em] uppercase text-foreground/90">
            Live Local
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Today's featured spots</p>
      </div>

      <div className="divide-y divide-border/40">
        {spotlights.slice(0, 2).map((spotlight) => {
          const cfg = TYPE_LABEL[spotlight.spotlight_type] ?? TYPE_LABEL.business;
          const Icon = cfg.icon;
          const business = spotlight.business;
          if (!business) return null;

          const href = business.slug
            ? `/business/${business.slug}`
            : `/business/${business.id}`;

          return (
            <Link
              key={spotlight.id}
              to={href}
              className="flex items-center gap-4 px-5 py-4 hover:bg-primary/5 transition-colors"
            >
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-muted shrink-0 border border-border/60">
                {business.logo_url ? (
                  <SecureImage
                    storagePath={business.logo_url}
                    alt={business.name}
                    className="w-full h-full object-cover"
                    fallback={
                      <div className="w-full h-full flex items-center justify-center bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                    }
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-primary/12 text-primary border border-primary/20 mb-1">
                  <Icon className="h-2.5 w-2.5" />
                  {cfg.label}
                </span>
                <h3 className="text-[14px] font-bold text-foreground leading-tight">
                  {spotlight.custom_headline || business.name}
                </h3>
                <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-1">
                  {spotlight.custom_description || business.description}
                </p>
                {business.neighborhood && (
                  <div className="flex items-center gap-1 mt-1.5 text-[11px] text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {business.neighborhood.name}
                  </div>
                )}
              </div>

              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
