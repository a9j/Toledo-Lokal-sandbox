import { Link } from 'react-router-dom';
import { MapPin, CheckCircle, Infinity, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SecureImage } from '@/components/ui/secure-image';
import { SavedCountBadge } from '@/components/discovery/SavedCountBadge';
import { TierBadge } from '@/components/business/TierBadge';
import * as LucideIcons from 'lucide-react';

interface BusinessCardProps {
  business: {
    id: string;
    name: string;
    description?: string | null;
    verified?: boolean | null;
    featured?: boolean | null;
    isInLoop?: boolean;
    logo_url?: string | null;
    neighborhood?: { name: string } | null;
    category?: { name: string; icon: string } | null;
    tier_status?: string | null;
    tier_badge_visible?: boolean | null;
  };
  savedCount?: number;
}

export function BusinessCard({ business, savedCount = 0 }: BusinessCardProps) {
  // Get the icon component dynamically (fallback when no logo)
  const iconName = business.category?.icon 
    ? business.category.icon.charAt(0).toUpperCase() + business.category.icon.slice(1).replace(/-([a-z])/g, g => g[1].toUpperCase())
    : 'Building2';
  const IconComponent = (LucideIcons as Record<string, any>)[iconName] || LucideIcons.Building2;

  return (
    <Link to={`/business/${business.id}`} className="block group">
      <div className="card-elevated p-4 hover-lift">
        <div className="flex items-center gap-4">
          {/* Logo or fallback icon */}
          <div className="relative flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-muted flex items-center justify-center overflow-hidden border border-border/30">
            {business.logo_url ? (
              <SecureImage
                storagePath={business.logo_url}
                alt={`${business.name} logo`}
                className="w-full h-full object-cover"
                fallback={<IconComponent className="h-7 w-7 text-muted-foreground" />}
              />
            ) : (
              <IconComponent className="h-7 w-7 text-muted-foreground" />
            )}
            
            {/* Verified badge overlay */}
            {business.verified && (
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-success flex items-center justify-center border-2 border-card">
                <CheckCircle className="h-3 w-3 text-success-foreground" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-1">
              <h3 className="font-semibold text-foreground leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                {business.name}
              </h3>
              {business.tier_status && business.tier_status !== 'general' && business.tier_badge_visible && (
                <TierBadge tier={business.tier_status as any} size="sm" />
              )}
            </div>
            
            {business.category && (
              <p className="text-sm text-muted-foreground mb-1.5">
                {business.category.name}
              </p>
            )}
            
            {business.neighborhood && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{business.neighborhood.name}</span>
              </div>
            )}
            
            {/* Tags row */}
            {(business.featured || business.isInLoop || savedCount >= 2) && (
              <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                {savedCount >= 2 && (
                  <SavedCountBadge count={savedCount} size="sm" />
                )}
                {business.featured && (
                  <Badge className="bg-lokal-amber/15 text-lokal-amber border-0 text-[10px] px-2 py-0.5 font-medium">
                    Featured
                  </Badge>
                )}
                {business.isInLoop && (
                  <Badge className="bg-primary/10 text-primary border-0 text-[10px] px-2 py-0.5 font-medium flex items-center gap-1">
                    <Infinity className="h-3 w-3" />
                    Loop
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          {/* Arrow indicator */}
          <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </div>
      </div>
    </Link>
  );
}