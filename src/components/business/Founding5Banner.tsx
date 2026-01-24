import { Crown } from 'lucide-react';

interface Founding5BannerProps {
  className?: string;
}

export function Founding5Banner({ className = '' }: Founding5BannerProps) {
  return (
    <div 
      className={`absolute top-3 left-3 z-10 ${className}`}
    >
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-white shadow-lg shadow-amber-500/30 animate-shimmer bg-[length:200%_100%]">
        <Crown className="h-4 w-4 drop-shadow-sm" />
        <span className="text-sm font-bold tracking-wide drop-shadow-sm">FOUNDING 5</span>
      </div>
    </div>
  );
}
