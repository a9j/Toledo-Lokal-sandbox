import tlLogo from '@/assets/tl-logo.png';
import { cn } from '@/lib/utils';

interface LogoLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function LogoLoader({ size = 'md', text, className }: LogoLoaderProps) {
  // Height-only sizing keeps the logo's native aspect ratio (it's a wide
  // wordmark, not a square) so it never gets squished.
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div className="relative inline-flex">
        <img
          src={tlLogo}
          alt="Loading"
          className={cn(
            sizeClasses[size],
            'w-auto object-contain animate-logo-pulse drop-shadow-md'
          )}
        />
        {/* Ripple ring */}
        <div
          className="absolute inset-0 rounded-2xl border-2 border-primary/30 animate-logo-ripple"
        />
      </div>
      {text && (
        <p className="text-sm text-muted-foreground animate-fade-in">{text}</p>
      )}
    </div>
  );
}
