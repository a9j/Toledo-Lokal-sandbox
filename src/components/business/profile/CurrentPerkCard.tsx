import { Gift, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

interface CurrentPerkCardProps {
  deal?: {
    id: string;
    title: string;
    description?: string | null;
    end_date: string;
  } | null;
  reward?: {
    id: string;
    name: string;
    points_cost: number;
  } | null;
}

export function CurrentPerkCard({ deal, reward }: CurrentPerkCardProps) {
  if (!deal && !reward) return null;

  return (
    <div className="bg-gradient-to-r from-lokal-amber-light to-secondary rounded-2xl p-5 border border-lokal-amber/20">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-lokal-amber/20 flex items-center justify-center flex-shrink-0">
          {deal ? (
            <Gift className="h-6 w-6 text-lokal-amber" />
          ) : (
            <Sparkles className="h-6 w-6 text-lokal-amber" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-lokal-terracotta uppercase tracking-wide mb-1">
            Current Local Perk
          </p>
          
          {deal && (
            <>
              <p className="text-foreground font-semibold">
                {deal.title}
              </p>
              {deal.description && (
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                  {deal.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Valid through {format(new Date(deal.end_date), 'MMM d')}
              </p>
            </>
          )}
          
          {!deal && reward && (
            <>
              <p className="text-foreground font-semibold">
                {reward.name}
              </p>
              <Link 
                to="/scan" 
                className="text-sm text-primary hover:underline mt-1 inline-block"
              >
                Earn {reward.points_cost} points to redeem →
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
