import { Link } from 'react-router-dom';
import { Heart, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SecureImage } from '@/components/ui/secure-image';
import { CommunityBusiness } from '@/hooks/useNonprofits';

interface CommunityBusinessCardProps {
  business: CommunityBusiness;
}

const CATEGORY_LABELS: Record<string, string> = {
  nonprofit: 'Nonprofit',
  community_org: 'Community Organization',
};

export function CommunityBusinessCard({ business }: CommunityBusinessCardProps) {
  return (
    <Link
      to={`/business/${business.slug || business.id}`}
      className="group block"
    >
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-border hover:-translate-y-0.5">
        {/* Cover Image */}
        <div className="relative h-32 bg-gradient-to-br from-muted to-muted/50">
          {business.cover_image_url ? (
            <SecureImage
              storagePath={business.cover_image_url}
              alt={business.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Heart className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
          <div className="absolute top-2 right-2">
            <Badge className="bg-rose-500/90 text-white border-0 gap-1 text-[10px] backdrop-blur-sm">
              <Building2 className="h-3 w-3" />
              {CATEGORY_LABELS[business.category] || 'Community'}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start gap-3 mb-3">
            {business.logo_url && (
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                <SecureImage
                  storagePath={business.logo_url}
                  alt={business.name}
                  className="w-full h-full"
                  imgClassName="object-contain"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                {business.name}
              </h3>
              {business.neighborhood?.name && (
                <p className="text-xs text-muted-foreground">{business.neighborhood.name}</p>
              )}
            </div>
          </div>

          {business.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {business.description}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
