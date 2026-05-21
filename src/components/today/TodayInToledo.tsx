import { Link } from 'react-router-dom';
import {
  Calendar,
  Tag,
  Megaphone,
  Sun,
  Lightbulb,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DailyDropHighlight } from '@/hooks/useDailyDrop';

const ICON_MAP: Record<string, any> = {
  event: Calendar,
  deal: Tag,
  announcement: Megaphone,
  weather: Sun,
  tip: Lightbulb,
};

interface TodayInToledoProps {
  highlights: DailyDropHighlight[];
}

export function TodayInToledo({ highlights }: TodayInToledoProps) {
  if (!highlights.length) return null;

  return (
    <div className="rounded-3xl border border-border/60 bg-card overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <h2 className="text-[11px] font-bold tracking-[0.22em] uppercase text-foreground/90">
            Today in Toledo
          </h2>
        </div>
      </div>

      <div className="divide-y divide-border/40">
        {highlights.slice(0, 3).map((highlight) => {
          const Icon = ICON_MAP[highlight.highlight_type] || Megaphone;

          const content = (
            <div
              className={cn(
                'flex items-center gap-3.5 px-5 py-4',
                highlight.link_url && 'hover:bg-primary/5 transition-colors cursor-pointer'
              )}
            >
              <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-primary" strokeWidth={2} />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-[14px] font-bold text-foreground leading-tight">
                  {highlight.title}
                </h3>
                {highlight.subtitle && (
                  <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-1">
                    {highlight.subtitle}
                  </p>
                )}
              </div>

              {highlight.link_url && (
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
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
