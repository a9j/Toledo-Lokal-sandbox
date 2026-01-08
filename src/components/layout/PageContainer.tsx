import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function PageContainer({ children, className, noPadding = false }: PageContainerProps) {
  return (
    <main className={cn(
      "min-h-screen pb-20 max-w-lg mx-auto",
      !noPadding && "px-4 py-4",
      className
    )}>
      {children}
    </main>
  );
}
