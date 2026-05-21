import { format } from 'date-fns';
import { Newspaper, Calendar, MapPin, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyDailyDropProps {
  date: Date;
}

export function EmptyDailyDrop({ date }: EmptyDailyDropProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-border/60 bg-card p-7 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
          <Newspaper className="h-6 w-6 text-primary" strokeWidth={1.8} />
        </div>
        <h2
          className="text-[26px] uppercase text-foreground mb-2"
          style={{ fontFamily: "'Anton', 'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.01em', lineHeight: 0.95 }}
        >
          No Daily Drop Yet
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Today's edition is being prepared. In the meantime, explore what Toledo has to offer.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {[
          { to: '/events', label: 'Events', Icon: Calendar },
          { to: '/near-me', label: 'Near Me', Icon: MapPin },
          { to: '/deals', label: 'Deals', Icon: Gift },
        ].map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-center justify-center gap-1.5 aspect-square rounded-2xl bg-card border border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all"
          >
            <Icon className="h-5 w-5 text-primary" strokeWidth={1.8} />
            <span className="text-[11px] font-semibold text-foreground/90">{label}</span>
          </Link>
        ))}
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        {format(date, 'EEEE, MMMM d, yyyy')}
      </p>
    </div>
  );
}
