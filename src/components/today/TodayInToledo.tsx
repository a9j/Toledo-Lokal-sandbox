import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Tag, 
  Megaphone, 
  Sun, 
  Lightbulb,
  ChevronRight 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DailyDropHighlight } from '@/hooks/useDailyDrop';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  event: Calendar,
  deal: Tag,
  announcement: Megaphone,
  weather: Sun,
  tip: Lightbulb,
};

const COLOR_MAP: Record<string, string> = {
  event: 'bg-primary/10 text-primary border-primary/20',
  deal: 'bg-toledo-rose/10 text-toledo-rose border-toledo-rose/20',
  announcement: 'bg-accent/10 text-accent border-accent/20',
  weather: 'bg-lokal-amber/10 text-lokal-amber border-lokal-amber/20',
  tip: 'bg-lokal-forest/10 text-lokal-forest border-lokal-forest/20',
};

interface TodayInToledoProps {
  highlights: DailyDropHighlight[];
}

export function TodayInToledo({ highlights }: TodayInToledoProps) {
  if (!highlights.length) return null;

  return (
    <div className="card-elevated-lg overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Today in Toledo
          </h2>
        </div>
      </div>

      {/* Highlights List */}
      <div className="divide-y divide-border/30">
        {highlights.slice(0, 3).map((highlight, index) => {
          const Icon = ICON_MAP[highlight.highlight_type] || Megaphone;
          const colorClass = COLOR_MAP[highlight.highlight_type] || COLOR_MAP.announcement;
          
          const content = (
            <div 
              className={cn(
                "flex items-center gap-4 px-5 py-4",
                highlight.link_url && "hover:bg-muted/30 transition-colors cursor-pointer"
              )}
            >
              {/* Icon Badge */}
              <div className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center border flex-shrink-0",
                colorClass
              )}>
                <Icon className="h-5 w-5" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground leading-tight">
                  {highlight.title}
                </h3>
                {highlight.subtitle && (
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                    {highlight.subtitle}
                  </p>
                )}
              </div>

              {/* Arrow */}
              {highlight.link_url && (
                <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              )}
            </div>
          );

          if (highlight.link_url) {
            const isExternal = highlight.link_url.startsWith('http');
            if (isExternal) {
              return (
                <a 
                  key={highlight.id} 
                  href={highlight.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {content}
                </a>
              );
            }
            return (
              <Link key={highlight.id} to={highlight.link_url}>
                {content}
              </Link>
            );
          }

          return <div key={highlight.id}>{content}</div>;
        })}
      </div>
    </div>
  );
}
