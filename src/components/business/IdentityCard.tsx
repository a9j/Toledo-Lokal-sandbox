import { SecureImage } from '@/components/ui/secure-image';
import { MapPin, Building2, Award, Heart, Briefcase } from 'lucide-react';
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

  // Determine tier badge
  const getTierBadge = () => {
    if (business.isFoundingMember) {
      return {
        label: 'Founding Local',
        icon: Award,
        className: 'bg-amber-50 text-amber-700 border border-amber-200'
      };
    }
    if (business.isNonprofit) {
      return {
        label: 'Nonprofit',
        icon: Heart,
        className: 'bg-rose-50 text-rose-700 border border-rose-200'
      };
    }
    if (business.loopTierId === 'local_pro') {
      return {
        label: 'Local Pro',
        icon: Briefcase,
        className: 'bg-primary/5 text-primary border border-primary/20'
      };
    }
    return null;
  };

  const tierBadge = getTierBadge();

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
          ) : (
            <CategoryIcon className="h-7 w-7 text-muted-foreground" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-foreground truncate">
            {business.name}
          </h1>

          {/* Location */}
          <div className="flex items-center gap-1.5 mt-1 text-muted-foreground text-sm">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">
              {isFoodTruck ? 'Mobile' : (business.neighborhood?.name || business.address || 'Toledo, OH')}
            </span>
          </div>

          {/* Category - subtle */}
          {business.category && (
            <p className="text-xs text-muted-foreground/70 mt-1">
              {business.category.name}
            </p>
          )}
        </div>
      </div>

      {/* Tier Badge */}
      {tierBadge && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${tierBadge.className}`}>
            <tierBadge.icon className="h-3.5 w-3.5" />
            {tierBadge.label}
          </div>
        </div>
      )}
    </div>
  );
}
