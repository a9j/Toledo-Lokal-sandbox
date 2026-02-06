import { TrendingUp, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NeighborhoodPopularityBadgeProps {
  count: number;
  neighborhoodName: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function NeighborhoodPopularityBadge({ 
  count, 
  neighborhoodName,
  size = 'sm', 
  className 
}: NeighborhoodPopularityBadgeProps) {
  if (count < 3) return null; // Only show if neighborhood has 3+ saved businesses
  
  const isHot = count >= 10;
  const Icon = isHot ? Flame : TrendingUp;
  const label = isHot 
    ? `Hot neighborhood` 
    : `${count} favorites in ${neighborhoodName}`;
  
  return (
    <Badge 
      className={cn(
        "border-0 font-medium flex items-center gap-1",
        isHot 
          ? "bg-lokal-amber/15 text-lokal-amber" 
          : "bg-secondary text-muted-foreground",
        size === 'sm' ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1",
        className
      )}
    >
      <Icon className={cn(size === 'sm' ? "h-2.5 w-2.5" : "h-3 w-3")} />
      {label}
    </Badge>
  );
}
