import { Sparkles, Calendar, Award } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Moment {
  id: string;
  type: 'daily_drop' | 'event' | 'mission';
  title: string;
  date: string;
}

interface MomentsCardProps {
  moments?: Moment[];
}

export function MomentsCard({ moments }: MomentsCardProps) {
  if (!moments || moments.length === 0) return null;

  const getIcon = (type: Moment['type']) => {
    switch (type) {
      case 'daily_drop':
        return Sparkles;
      case 'event':
        return Calendar;
      case 'mission':
        return Award;
      default:
        return Sparkles;
    }
  };

  const getLabel = (type: Moment['type']) => {
    switch (type) {
      case 'daily_drop':
        return 'Featured in Daily Drop';
      case 'event':
        return 'Hosted Event';
      case 'mission':
        return 'Mission Participant';
      default:
        return 'Community Moment';
    }
  };

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/50">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
        Moments
      </h2>

      <div className="space-y-3">
        {moments.slice(0, 5).map((moment) => {
          const Icon = getIcon(moment.type);
          return (
            <div 
              key={moment.id} 
              className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {moment.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {getLabel(moment.type)} · {formatDistanceToNow(new Date(moment.date), { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
