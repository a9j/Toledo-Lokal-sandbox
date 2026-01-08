import { Link } from 'react-router-dom';
import { MapPin, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import * as LucideIcons from 'lucide-react';

interface BusinessCardProps {
  business: {
    id: string;
    name: string;
    description?: string | null;
    verified?: boolean | null;
    featured?: boolean | null;
    neighborhood?: { name: string } | null;
    category?: { name: string; icon: string } | null;
  };
}

export function BusinessCard({ business }: BusinessCardProps) {
  // Get the icon component dynamically
  const iconName = business.category?.icon 
    ? business.category.icon.charAt(0).toUpperCase() + business.category.icon.slice(1).replace(/-([a-z])/g, g => g[1].toUpperCase())
    : 'Building2';
  const IconComponent = (LucideIcons as Record<string, any>)[iconName] || LucideIcons.Building2;

  return (
    <Link to={`/business/${business.id}`} className="block">
      <div className="card-elevated p-4 hover-lift">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-secondary flex items-center justify-center">
            <IconComponent className="h-6 w-6 text-foreground" />
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
            
            {business.featured && (
              <Badge variant="secondary" className="mt-2 bg-warning/10 text-warning text-[10px] px-1.5">
                Featured
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
