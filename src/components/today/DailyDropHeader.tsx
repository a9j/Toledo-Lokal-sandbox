import { format, isToday } from 'date-fns';
import { Sun, Cloud, Snowflake, CloudRain } from 'lucide-react';

interface DailyDropHeaderProps {
  date: Date;
  title?: string | null;
  isStale?: boolean;
}

export function DailyDropHeader({ date, title, isStale }: DailyDropHeaderProps) {
  const dayName = format(date, 'EEEE');
  const monthDay = format(date, 'MMMM d');
  const year = format(date, 'yyyy');

  const month = date.getMonth();
  const WeatherIcon =
    month >= 11 || month <= 2 ? Snowflake
    : month >= 3 && month <= 4 ? CloudRain
    : month >= 5 && month <= 8 ? Sun
    : Cloud;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-6 shadow-soft-xl">
      {/* Subtle blue glow */}
      <div
        className="absolute inset-0 opacity-90 pointer-events-none"
        style={{
          background: `
            radial-gradient(90% 70% at 100% 0%, hsl(var(--primary) / 0.18) 0%, transparent 55%),
            radial-gradient(70% 60% at 0% 100%, hsl(var(--primary) / 0.08) 0%, transparent 55%)
          `,
        }}
      />

      {isStale && (
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
          Most Recent
        </div>
      )}

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-[0.22em] uppercase text-primary/90 mb-2">
            {isToday(date) ? "Today's" : `${dayName}'s`} Edition
          </p>
          <h1
            className="uppercase text-foreground"
            style={{
              fontFamily: "'Anton', 'Plus Jakarta Sans', sans-serif",
              fontSize: 'clamp(2rem, 9vw, 2.75rem)',
              lineHeight: 0.95,
              letterSpacing: '-0.01em',
            }}
          >
            {title || monthDay}
          </h1>
          <p className="text-xs text-muted-foreground mt-2">
            Toledo, Ohio • {year}
          </p>
        </div>

        <div className="shrink-0 w-12 h-12 rounded-2xl bg-primary/12 border border-primary/20 flex items-center justify-center">
          <WeatherIcon className="h-5 w-5 text-primary" strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
}
