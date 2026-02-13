import tlLogo from '@/assets/tl-logo.png';
import { cn } from '@/lib/utils';

interface LogoLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function LogoLoader({ size = 'md', text, className }: LogoLoaderProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div className="relative">
        <img
          src={tlLogo}
          alt="Loading"
          className={cn(
            sizeClasses[size],
            'animate-logo-pulse drop-shadow-md'
          )}
        />
        {/* Ripple ring */}
        <div
          className={cn(
            'absolute inset-0 rounded-full border-2 border-primary/30 animate-logo-ripple',
            sizeClasses[size]
          )}
        />
      </div>
      {text && (
        <p className="text-sm text-muted-foreground animate-fade-in">{text}</p>
      )}
    </div>
  );
}
