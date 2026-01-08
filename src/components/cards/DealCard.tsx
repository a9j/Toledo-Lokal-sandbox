import { Link } from 'react-router-dom';
import { Tag, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
      category?: { name: string; icon: string } | null;
    } | null;
  };
}

export function DealCard({ deal }: DealCardProps) {
  const expiresIn = formatDistanceToNow(new Date(deal.end_date), { addSuffix: true });

  return (
    <Link to={`/deals/${deal.id}`} className="block">
      <div className="card-elevated p-4 hover-lift">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Tag className="h-6 w-6 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {deal.featured && (
                <Badge variant="secondary" className="bg-warning/10 text-warning text-[10px] px-1.5">
                  Featured
                </Badge>
              )}
              {deal.business?.category && (
                <span className="text-xs text-muted-foreground">
                  {deal.business.category.name}
                </span>
              )}
            </div>
            
            <h3 className="font-semibold text-foreground truncate">{deal.title}</h3>
            
            {deal.business && (
              <p className="text-sm text-muted-foreground truncate">
                {deal.business.name}
                {deal.business.neighborhood && ` · ${deal.business.neighborhood.name}`}
              </p>
            )}
            
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Expires {expiresIn}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
