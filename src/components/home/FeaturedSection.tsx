import { Link } from 'react-router-dom';
import { ChevronRight, Sparkles } from 'lucide-react';
import { FeaturedListingCard } from '@/components/cards/FeaturedListingCard';
import { Skeleton } from '@/components/ui/skeleton';

interface FeaturedSectionProps {
  title: string;
  subtitle?: string;
  viewAllLink?: string;
  businesses: any[] | undefined;
  isLoading: boolean;
  showLabel?: boolean;
  labelText?: string;
}

export function FeaturedSection({ 
  title, 
  subtitle,
  viewAllLink, 
  businesses, 
  isLoading,
  showLabel = true,
  labelText = "Featured"
}: FeaturedSectionProps) {
  return (
    <section className="px-4 py-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          {showLabel && (
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="section-label">{labelText}</span>
            </div>
          )}
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {viewAllLink && (
          <Link 
            to={viewAllLink} 
            className="flex items-center gap-0.5 text-sm font-medium text-primary hover:underline pt-1"
          >
            View all
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : businesses?.length ? (
        <div className="space-y-4">
          {businesses.slice(0, 3).map((business) => (
            <FeaturedListingCard key={business.id} business={business} />
          ))}
        </div>
      ) : (
        <div className="card-elevated p-8 text-center">
          <p className="text-muted-foreground">No listings yet</p>
        </div>
      )}
    </section>
  );
}
