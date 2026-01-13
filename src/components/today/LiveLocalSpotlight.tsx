import { Link } from 'react-router-dom';
import { MapPin, ChevronRight, Store, Truck, Heart } from 'lucide-react';
import { SecureImage } from '@/components/ui/secure-image';
import { cn } from '@/lib/utils';
import { DailyDropSpotlight } from '@/hooks/useDailyDrop';

const TYPE_CONFIG = {
  business: {
    icon: Store,
    label: 'Featured Business',
    color: 'text-primary bg-primary/10 border-primary/20',
  },
  food_truck: {
    icon: Truck,
    label: 'Food Truck',
    color: 'text-toledo-rose bg-toledo-rose/10 border-toledo-rose/20',
  },
  nonprofit: {
    icon: Heart,
    label: 'Nonprofit',
    color: 'text-lokal-forest bg-lokal-forest/10 border-lokal-forest/20',
  },
};

interface LiveLocalSpotlightProps {
  spotlights: DailyDropSpotlight[];
}

export function LiveLocalSpotlight({ spotlights }: LiveLocalSpotlightProps) {
  if (!spotlights.length) return null;

  return (
    <div className="card-elevated-lg overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-lokal-forest animate-pulse" />
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Live Local
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Today's featured spots
        </p>
      </div>

      {/* Spotlights */}
      <div className="divide-y divide-border/30">
        {spotlights.slice(0, 2).map((spotlight) => {
          const config = TYPE_CONFIG[spotlight.spotlight_type];
          const Icon = config.icon;
          const business = spotlight.business;
          
          if (!business) return null;

          const href = business.slug 
            ? `/business/${business.slug}` 
            : `/business/${business.id}`;

          return (
            <Link 
              key={spotlight.id}
              to={href}
              className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors"
            >
              {/* Business Logo/Image */}
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted flex-shrink-0">
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

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Type Badge */}
                <span className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border mb-1",
                  config.color
                )}>
                  <Icon className="h-2.5 w-2.5" />
                  {config.label}
                </span>
                
                <h3 className="font-semibold text-foreground leading-tight">
                  {spotlight.custom_headline || business.name}
                </h3>
                
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                  {spotlight.custom_description || business.description}
                </p>
                
                {business.neighborhood && (
                  <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {business.neighborhood.name}
                  </div>
                )}
              </div>

              {/* Arrow */}
              <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
