import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ProfileTab, PROFILE_TABS } from '@/lib/business-profile-config';

interface ProfileTabsProps {
  active: ProfileTab;
  onChange: (tab: ProfileTab) => void;
  hiddenTabs?: ProfileTab[];
}

export function ProfileTabs({ active, onChange, hiddenTabs = [] }: ProfileTabsProps) {
  const activeRef = useRef<HTMLButtonElement>(null);

  // Keep the active tab in view on smaller screens.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [active]);

  return (
    <div className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur-md">
      <div className="flex gap-1 overflow-x-auto scrollbar-hide px-3 py-2">
        {PROFILE_TABS.filter(t => !hiddenTabs.includes(t.id)).map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              ref={isActive ? activeRef : undefined}
              onClick={() => onChange(tab.id)}
              className={cn(
                'whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                isActive ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-secondary'
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
