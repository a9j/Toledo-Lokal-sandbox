import { SecureImage } from '@/components/ui/secure-image';
import { MapPin, Building2, Award, Heart, Briefcase, Truck } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface IdentityCardProps {
  business: {
    name: string;
    logo_url?: string | null;
    address?: string | null;
    category?: { name: string; icon?: string | null } | null;
    neighborhood?: { name: string } | null;
    verified?: boolean | null;
    isInLoop?: boolean;
    isFoundingMember?: boolean;
    isNonprofit?: boolean;
    loopTierId?: string;
  };
  isFoodTruck?: boolean;
}

export function IdentityCard({ business, isFoodTruck }: IdentityCardProps) {
  const getIcon = (iconName?: string | null) => {
    if (!iconName) return Building2;
    const name = iconName.charAt(0).toUpperCase() + iconName.slice(1).replace(/-([a-z])/g, g => g[1].toUpperCase());
    return (LucideIcons as Record<string, any>)[name] || Building2;
  };

  const CategoryIcon = getIcon(business.category?.icon);

  // Determine tier badge based on spec
  const getTierBadge = () => {
    // Founding Local (permanent, gold/heritage style)
    if (business.isFoundingMember) {
      return {
        label: 'Founding Local',
        icon: Award,
        className: 'bg-amber-50 text-amber-800 border border-amber-200'
      };
    }
    // Nonprofit
    if (business.isNonprofit || business.category?.name?.toLowerCase().includes('nonprofit')) {
      return {
        label: 'Nonprofit',
        icon: Heart,
        className: 'bg-rose-50 text-rose-700 border border-rose-200'
      };
    }
    // Local Pro
    if (business.loopTierId === 'growth' || business.loopTierId === 'pro') {
      return {
        label: 'Local Pro',
        icon: Briefcase,
        className: 'bg-primary/5 text-primary border border-primary/20'
      };
    }
    // Community Business (no badge shown per spec)
    return null;
  };

  const tierBadge = getTierBadge();

  // Determine location text
  const getLocationText = () => {
    if (isFoodTruck) return 'Mobile';
    if (business.neighborhood?.name) return business.neighborhood.name;
    if (business.address) {
      // Extract city/area from address
      const parts = business.address.split(',');
      return parts.length > 1 ? parts[1].trim() : business.address;
    }
    return 'Toledo';
  };

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/50">
      <div className="flex items-start gap-4">
        {/* Logo */}
        <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
          {business.logo_url ? (
            <SecureImage
              storagePath={business.logo_url}
              alt={business.name}
              className="w-full h-full object-cover"
              loading="eager"
            />
          ) : isFoodTruck ? (
            <Truck className="h-7 w-7 text-muted-foreground" />
          ) : (
            <CategoryIcon className="h-7 w-7 text-muted-foreground" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-foreground">
            {business.name}
          </h1>

          {/* Location */}
          <div className="flex items-center gap-1.5 mt-1 text-muted-foreground text-sm">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{getLocationText()}</span>
          </div>

          {/* Category */}
          {business.category && (
            <p className="text-xs text-muted-foreground/70 mt-1">
              {isFoodTruck ? 'Food Truck' : business.category.name}
            </p>
          )}

          {/* Tier Badge - inline with info */}
          {tierBadge && (
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mt-2 ${tierBadge.className}`}>
              <tierBadge.icon className="h-3 w-3" />
              {tierBadge.label}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
