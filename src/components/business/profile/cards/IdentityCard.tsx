import { useEffect } from 'react';
import { SecureImage, prefetchSignedUrls } from '@/components/ui/secure-image';
import { MapPin, Building2, Truck, Heart, Star, Users, Sparkles, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TierBadge, TierLabel } from '@/components/business/TierBadge';
import { Button } from '@/components/ui/button';
import { FlipCard } from '../FlipCard';
import { SavedCountBadge } from '@/components/discovery/SavedCountBadge';
import { NeighborhoodPopularityBadge } from '@/components/discovery/NeighborhoodPopularityBadge';
import * as LucideIcons from 'lucide-react';

export interface IdentityCardProps {
  business: {
    id: string;
    name: string;
    description?: string | null;
    logo_url?: string | null;
    category?: { name: string; icon?: string | null } | null;
    neighborhood?: { name: string } | null;
    photos?: string[] | null;
  };
  isFoodTruck?: boolean;
  isNonprofit?: boolean;
  isFoundingMember?: boolean;
  tierStatus?: string | null;
  tierBadgeVisible?: boolean | null;
  tierAssignedAt?: string | null;
  isLocallyOwned?: boolean;
  activeThisWeek?: boolean;
  onVisit?: () => void;
  onSupport?: () => void;
  onSave?: () => void;
  isSaved?: boolean;
  savedCount?: number;
  neighborhoodPopularity?: number;
}

export function IdentityCard({ 
  business, 
  isFoodTruck, 
  isNonprofit,
  isFoundingMember,
  tierStatus,
  tierBadgeVisible = true,
  tierAssignedAt,
  isLocallyOwned = true,
  activeThisWeek = true,
  onVisit,
  onSupport,
  onSave,
  isSaved,
  savedCount = 0,
  neighborhoodPopularity = 0
}: IdentityCardProps) {
  const getIcon = (iconName?: string | null) => {
    if (!iconName) return Building2;
    const name = iconName.charAt(0).toUpperCase() + iconName.slice(1).replace(/-([a-z])/g, g => g[1].toUpperCase());
    return (LucideIcons as Record<string, any>)[name] || Building2;
  };

  const CategoryIcon = isFoodTruck ? Truck : isNonprofit ? Heart : getIcon(business.category?.icon);
  const heroPhoto = business.photos?.[0];

  // Prefetch all business images on mount for faster loading
  useEffect(() => {
    const imagesToPrefetch: string[] = [];
    if (business.logo_url) imagesToPrefetch.push(business.logo_url);
    if (business.photos) imagesToPrefetch.push(...business.photos);
    if (imagesToPrefetch.length > 0) {
      prefetchSignedUrls(imagesToPrefetch);
    }
  }, [business.logo_url, business.photos]);

  return (
    <FlipCard>
      <div className="h-full flex flex-col">
        {/* Hero Background */}
        <div className="relative flex-1 min-h-[280px] rounded-3xl overflow-hidden">
          {/* Background Image or Gradient */}
          <div className="absolute inset-0">
            {heroPhoto ? (
              <>
              <SecureImage
                  storagePath={heroPhoto}
                  alt=""
                  className="w-full h-full"
                  imgClassName="object-cover"
                  priority
                  blurUp={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/10 via-secondary to-muted" />
            )}
          </div>

          {/* Content Overlay */}
          <div className="relative h-full flex flex-col justify-end p-6">
            {/* Logo */}
            <div className="w-20 h-20 rounded-2xl bg-card shadow-xl flex items-center justify-center overflow-hidden border-2 border-background mb-4 p-2">
              {business.logo_url ? (
                <SecureImage
                  storagePath={business.logo_url}
                  alt={business.name}
                  className="w-full h-full"
                  imgClassName="object-contain"
                  priority
                  blurUp={false}
                />
              ) : (
                <CategoryIcon className="h-8 w-8 text-muted-foreground" />
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-3xl font-bold text-foreground">
                {business.name}
              </h1>
              {tierStatus && tierStatus !== 'general' && tierBadgeVisible && (
                <TierBadge tier={tierStatus as any} size="md" />
              )}
            </div>
            {tierStatus && tierStatus !== 'general' && tierBadgeVisible && (
              <TierLabel tier={tierStatus} assignedAt={tierAssignedAt} />
            )}

            {/* Description */}
            {business.description && (
              <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                {business.description}
              </p>
            )}

            {/* Category & Neighborhood Tags */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge variant="secondary" className="gap-1.5">
                <CategoryIcon className="h-3 w-3" />
                {isFoodTruck ? 'Food Truck' : isNonprofit ? 'Nonprofit' : business.category?.name || 'Business'}
              </Badge>
              {business.neighborhood?.name && (
                <Badge variant="outline" className="gap-1.5">
                  <MapPin className="h-3 w-3" />
                  {business.neighborhood.name}
                </Badge>
              )}
            </div>

            {/* Trust Badges + Discovery Signals */}
            <div className="flex flex-wrap gap-2 mb-6">
              {/* Discovery Signal: Saved Count */}
              {savedCount >= 2 && (
                <SavedCountBadge count={savedCount} size="md" />
              )}
              {/* Discovery Signal: Neighborhood Popularity */}
              {neighborhoodPopularity >= 3 && business.neighborhood?.name && (
                <NeighborhoodPopularityBadge 
                  count={neighborhoodPopularity} 
                  neighborhoodName={business.neighborhood.name}
                  size="md"
                />
              )}
              {isFoundingMember && (
                <Badge className="bg-lokal-amber/20 text-foreground border-lokal-amber/30 gap-1">
                  <Star className="h-3 w-3 fill-current text-lokal-amber" />
                  Founding 5
                </Badge>
              )}
              {isLocallyOwned && (
                <Badge variant="outline" className="gap-1 border-lokal-forest/30 text-lokal-forest">
                  <Shield className="h-3 w-3" />
                  Locally Owned
                </Badge>
              )}
              {activeThisWeek && (
                <Badge variant="outline" className="gap-1 border-primary/30">
                  <Sparkles className="h-3 w-3" />
                  Active This Week
                </Badge>
              )}
              {isNonprofit && (
                <Badge variant="outline" className="gap-1 border-lokal-terracotta/30 text-lokal-terracotta">
                  <Heart className="h-3 w-3" />
                  Community Partner
                </Badge>
              )}
            </div>

            {/* Primary CTAs */}
            <div className="flex gap-3">
              <Button onClick={onVisit} className="flex-1">
                Visit
              </Button>
              <Button onClick={onSupport} variant="secondary" className="flex-1">
                {isNonprofit ? 'Donate' : 'Support'}
              </Button>
              <Button 
                onClick={onSave} 
                variant={isSaved ? "default" : "outline"} 
                className="px-4"
              >
                {isSaved ? 'Saved' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </FlipCard>
  );
}
