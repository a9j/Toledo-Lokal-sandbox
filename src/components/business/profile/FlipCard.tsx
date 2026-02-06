import { cn } from '@/lib/utils';

interface FlipCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export function FlipCard({ children, className, title }: FlipCardProps) {
  return (
    <div 
      className={cn(
        "h-full w-full overflow-y-auto overscroll-contain",
        "bg-background px-4 py-6",
        className
      )}
    >
      <div className="max-w-lg mx-auto h-full flex flex-col">
        {title && (
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            {title}
          </h2>
        )}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
