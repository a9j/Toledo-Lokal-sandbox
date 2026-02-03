import { SecureImage } from '@/components/ui/secure-image';
import { MapPin, Building2, Truck, Heart } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface HeroCardProps {
  business: {
    name: string;
    logo_url?: string | null;
    category?: { name: string; icon?: string | null } | null;
    neighborhood?: { name: string } | null;
    photos?: string[] | null;
  };
  isFoodTruck?: boolean;
  isNonprofit?: boolean;
}

export function HeroCard({ business, isFoodTruck, isNonprofit }: HeroCardProps) {
  const getIcon = (iconName?: string | null) => {
    if (!iconName) return Building2;
    const name = iconName.charAt(0).toUpperCase() + iconName.slice(1).replace(/-([a-z])/g, g => g[1].toUpperCase());
    return (LucideIcons as Record<string, any>)[name] || Building2;
  };

  const CategoryIcon = isFoodTruck ? Truck : isNonprofit ? Heart : getIcon(business.category?.icon);
  const heroPhoto = business.photos?.[0];

  return (
    <div className="relative overflow-hidden rounded-3xl">
      {/* Background - gradient or blurred image */}
      <div className="absolute inset-0">
        {heroPhoto ? (
          <>
            <SecureImage
              storagePath={heroPhoto}
              alt=""
              className="w-full h-full object-cover blur-xl opacity-40 scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-secondary via-muted to-secondary/80" />
        )}
      </div>

      {/* Content */}
      <div className="relative px-6 py-8 flex flex-col items-center text-center">
        {/* Logo */}
        <div className="w-20 h-20 rounded-2xl bg-card shadow-lg flex items-center justify-center overflow-hidden border-2 border-background mb-4">
          {business.logo_url ? (
            <SecureImage
              storagePath={business.logo_url}
              alt={business.name}
              className="w-full h-full object-cover"
              loading="eager"
            />
          ) : (
            <CategoryIcon className="h-8 w-8 text-muted-foreground" />
          )}
        </div>

        {/* Name */}
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {business.name}
        </h1>

        {/* Category & Neighborhood Tags */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {/* Category */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card/80 backdrop-blur-sm text-sm text-muted-foreground border border-border/50">
            <CategoryIcon className="h-3.5 w-3.5" />
            {isFoodTruck ? 'Food Truck' : isNonprofit ? 'Nonprofit' : business.category?.name || 'Business'}
          </span>

          {/* Neighborhood */}
          {business.neighborhood?.name && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card/80 backdrop-blur-sm text-sm text-muted-foreground border border-border/50">
              <MapPin className="h-3.5 w-3.5" />
              {business.neighborhood.name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
