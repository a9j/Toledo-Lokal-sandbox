import { format } from 'date-fns';
import { Newspaper, Calendar, MapPin, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface EmptyDailyDropProps {
  date: Date;
}

export function EmptyDailyDrop({ date }: EmptyDailyDropProps) {
  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="card-elevated-lg p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
          <Newspaper className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">
          No Daily Drop Yet
        </h2>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Today's edition is being prepared. In the meantime, explore what Toledo has to offer.
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-3 gap-3">
        <Link to="/events" className="card-elevated p-4 text-center hover:bg-muted/50 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground">Events</span>
        </Link>
        
        <Link to="/near-me" className="card-elevated p-4 text-center hover:bg-muted/50 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-lokal-forest/10 flex items-center justify-center mx-auto mb-2">
            <MapPin className="h-6 w-6 text-lokal-forest" />
          </div>
          <span className="text-sm font-medium text-foreground">Near Me</span>
        </Link>
        
        <Link to="/deals" className="card-elevated p-4 text-center hover:bg-muted/50 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-toledo-rose/10 flex items-center justify-center mx-auto mb-2">
            <Gift className="h-6 w-6 text-toledo-rose" />
          </div>
          <span className="text-sm font-medium text-foreground">Deals</span>
        </Link>
      </div>

      {/* Date Info */}
      <p className="text-center text-xs text-muted-foreground">
        {format(date, 'EEEE, MMMM d, yyyy')}
      </p>
    </div>
  );
}
