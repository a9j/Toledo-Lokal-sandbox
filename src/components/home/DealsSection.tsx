import { Link } from 'react-router-dom';
import { ChevronRight, Tag, Clock, Percent } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface Deal {
  id: string;
  title: string;
  end_date: string;
  featured?: boolean | null;
  business?: {
    name: string;
    category?: { name: string } | null;
    neighborhood?: { name: string } | null;
  } | null;
}

interface DealsSectionProps {
  deals: Deal[] | undefined;
  isLoading: boolean;
}

export function DealsSection({ deals, isLoading }: DealsSectionProps) {
  return (
    <section className="px-4 py-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Percent className="h-4 w-4 text-primary" />
            <span className="section-label">Special Offers</span>
          </div>
          <h2 className="text-xl font-bold text-foreground">Today's Best Deals</h2>
        </div>
        <Link 
          to="/deals" 
          className="flex items-center gap-0.5 text-sm font-medium text-primary hover:underline pt-1"
        >
          View all
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Deals list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : deals?.length ? (
        <div className="space-y-3">
          {deals.slice(0, 3).map((deal) => {
            const expiresIn = formatDistanceToNow(new Date(deal.end_date), { addSuffix: true });
            
            return (
              <Link key={deal.id} to={`/deals/${deal.id}`} className="block group">
                <div className="card-elevated p-4 hover-lift flex items-center gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-toledo-gold/20 to-primary/20 flex items-center justify-center">
                    <Tag className="h-6 w-6 text-primary" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {deal.featured && (
                        <span className="badge-featured text-[10px] py-0.5">Hot Deal</span>
                      )}
                      {deal.business?.category && (
                        <span className="text-xs text-muted-foreground">
                          {deal.business.category.name}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors truncate">
                      {deal.title}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground truncate">
                      {deal.business?.name}
                      {deal.business?.neighborhood && ` · ${deal.business.neighborhood.name}`}
                    </p>
                  </div>
                  
                  {/* Timer */}
                  <div className="flex-shrink-0 text-right">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <Clock className="h-3 w-3" />
                      <span>Ends {expiresIn}</span>
                    </div>
                    <span className="text-sm font-medium text-primary">
                      View →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="card-elevated p-8 text-center">
          <Tag className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No deals available right now</p>
        </div>
      )}
    </section>
  );
}
