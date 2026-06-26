import { Link } from 'react-router-dom';
import { Clock, Percent } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface DealCardProps {
  deal: {
    id: string;
    title: string;
    description?: string | null;
    end_date: string;
    featured?: boolean | null;
    business?: {
      id: string;
      name: string;
      neighborhood?: { name: string } | null;
      category?: { name: string; icon: string | null } | null;
    } | null;
  };
}

export function DealCard({ deal }: DealCardProps) {
  const expiresIn = formatDistanceToNow(new Date(deal.end_date), { addSuffix: true });

  return (
    <Link to={deal.business ? `/business/${deal.business.id}` : '#'} className="block group">
      <div className="card-elevated p-4 flex gap-4 hover:bg-secondary/30 transition-colors">
        {/* Icon */}
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
          <Percent className="h-5 w-5 text-accent" />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-medium text-foreground text-sm truncate group-hover:text-accent transition-colors">
                {deal.title}
              </h3>
              {deal.business && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {deal.business.name}
                  {deal.business.neighborhood && ` · ${deal.business.neighborhood.name}`}
                </p>
              )}
            </div>
            {deal.featured && (
              <span className="flex-shrink-0 text-[10px] font-semibold text-toledo-gold uppercase tracking-wide">
                Featured
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Ends {expiresIn}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
