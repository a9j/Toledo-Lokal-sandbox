import { Link } from 'react-router-dom';
import { MapPin, CheckCircle, Infinity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SecureImage } from '@/components/ui/secure-image';
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
  };
}

export function BusinessCard({ business }: BusinessCardProps) {
  // Get the icon component dynamically (fallback when no logo)
  const iconName = business.category?.icon 
    ? business.category.icon.charAt(0).toUpperCase() + business.category.icon.slice(1).replace(/-([a-z])/g, g => g[1].toUpperCase())
    : 'Building2';
  const IconComponent = (LucideIcons as Record<string, any>)[iconName] || LucideIcons.Building2;

  return (
    <Link to={`/business/${business.id}`} className="block">
      <div className="card-elevated p-4 hover-lift">
        <div className="flex items-start gap-3">
          {/* Logo or fallback icon */}
          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-secondary flex items-center justify-center overflow-hidden">
            {business.logo_url ? (
              <SecureImage
                storagePath={business.logo_url}
                alt={`${business.name} logo`}
                className="w-full h-full object-contain"
                fallback={<IconComponent className="h-6 w-6 text-foreground" />}
              />
            ) : (
              <IconComponent className="h-6 w-6 text-foreground" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-semibold text-foreground truncate">{business.name}</h3>
              {business.verified && (
                <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
              )}
            </div>
            
            {business.category && (
              <p className="text-sm text-muted-foreground">
                {business.category.name}
              </p>
            )}
            
            {business.neighborhood && (
              <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{business.neighborhood.name}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 mt-2">
              {business.featured && (
                <Badge variant="secondary" className="bg-warning/10 text-warning text-[10px] px-1.5">
                  Featured
                </Badge>
              )}
              {business.isInLoop && (
                <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px] px-1.5 flex items-center gap-1">
                  <Infinity className="h-3 w-3" />
                  in the loop
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
