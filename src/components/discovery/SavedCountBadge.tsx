import { Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SavedCountBadgeProps {
  count: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function SavedCountBadge({ count, size = 'sm', className }: SavedCountBadgeProps) {
  if (count < 2) return null; // Only show if 2+ people have saved
  
  const label = count >= 10 
    ? `${count}+ locals love this` 
    : `In ${count} collections`;
  
  return (
    <Badge 
      className={cn(
        "bg-primary/10 text-primary border-0 font-medium flex items-center gap-1",
        size === 'sm' ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1",
        className
      )}
    >
      <Heart className={cn("fill-current", size === 'sm' ? "h-2.5 w-2.5" : "h-3 w-3")} />
      {label}
    </Badge>
  );
}
