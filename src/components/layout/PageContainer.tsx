import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function PageContainer({ children, className, noPadding = false }: PageContainerProps) {
  return (
    <main
      className={cn(
        "min-h-[100dvh] w-full max-w-lg mx-auto pb-[calc(9rem+env(safe-area-inset-bottom))]",
        !noPadding && "px-4 py-4",
        className
      )}
    >
      {children}
    </main>
  );
}
