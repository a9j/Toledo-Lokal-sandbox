import { format, isToday } from 'date-fns';
import { Sun, Cloud, Snowflake, CloudRain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DailyDropHeaderProps {
  date: Date;
  title?: string | null;
  isStale?: boolean;
}

export function DailyDropHeader({ date, title, isStale }: DailyDropHeaderProps) {
  const dayName = format(date, 'EEEE');
  const monthDay = format(date, 'MMMM d');
  const year = format(date, 'yyyy');

  // Get a simple weather-themed icon based on month (placeholder)
  const month = date.getMonth();
  const WeatherIcon = month >= 11 || month <= 2 ? Snowflake 
    : month >= 3 && month <= 4 ? CloudRain
    : month >= 5 && month <= 8 ? Sun
    : Cloud;

  return (
    <div className="card-elevated-lg p-6 relative overflow-hidden">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      
      {/* Stale drop indicator */}
      {isStale && (
        <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
          Most Recent
        </div>
      )}
      
      <div className="relative flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">
              {isToday(date) ? "Today's" : dayName + "'s"} Edition
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground tracking-tight">
            {title || monthDay}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Toledo, Ohio • {year}
          </p>
        </div>
        
        <div className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center",
          "bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20"
        )}>
          <WeatherIcon className="h-7 w-7 text-accent" />
        </div>
      </div>
    </div>
  );
}
