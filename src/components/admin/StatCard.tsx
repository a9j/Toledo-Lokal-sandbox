import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  iconColor?: string;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, iconColor = 'text-primary', className }: StatCardProps) {
  return (
    <div className={cn('card-elevated p-4 flex items-start gap-3', className)}>
      <div className={cn('rounded-lg bg-primary/5 p-2', iconColor)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground truncate">{label}</p>
      </div>
    </div>
  );
}
