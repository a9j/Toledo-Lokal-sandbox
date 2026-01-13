import { Sparkles, Calendar, Award, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Moment {
  id: string;
  type: 'daily_drop' | 'event' | 'mission' | 'spotlight' | 'community';
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
      case 'spotlight':
        return Sparkles;
      case 'community':
        return Users;
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
        return 'Mission participant';
      case 'spotlight':
        return 'Founding Local spotlight';
      case 'community':
        return 'Community highlight';
      default:
        return 'Community Moment';
    }
  };

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/50">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
        Moments
      </h2>

      <div className="space-y-2">
        {moments.slice(0, 5).map((moment) => {
          const Icon = getIcon(moment.type);
          return (
            <div 
              key={moment.id} 
              className="flex items-start gap-3 py-2"
            >
              <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">
                  • {moment.title}
                  {moment.date && (
                    <span className="text-muted-foreground"> — {formatDistanceToNow(new Date(moment.date), { addSuffix: false })}</span>
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
