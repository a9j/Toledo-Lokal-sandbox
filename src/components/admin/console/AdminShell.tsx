import { ReactNode, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Menu, X, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export interface AdminNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  soon?: boolean;
}

export interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

interface AdminShellProps {
  groups: AdminNavGroup[];
  active: string;
  onSelect: (id: string) => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

// Linear/Notion-style admin shell: persistent left rail on desktop, slide-over on mobile.
export function AdminShell({ groups, active, onSelect, title, subtitle, children }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const Nav = (
    <nav className="flex flex-col gap-5 p-3 pb-24">
      <button
        onClick={() => navigate('/profile')}
        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-foreground/70 hover:bg-secondary transition-colors"
      >
        <ArrowLeft className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1 text-left">Back to Profile</span>
      </button>
      {groups.map((group) => (
        <div key={group.label}>
          <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{group.label}</p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const isActive = item.id === active;
              return (
                <button
                  key={item.id}
                  disabled={item.soon}
                  onClick={() => { onSelect(item.id); setMobileOpen(false); }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-primary/10 text-primary' : 'text-foreground/70 hover:bg-secondary',
                    item.soon && 'cursor-not-allowed opacity-50 hover:bg-transparent'
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.soon && <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[9px] font-semibold uppercase text-muted-foreground">Soon</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-[100dvh] bg-muted/30">
      <div className="mx-auto flex max-w-7xl">
        {/* Desktop rail */}
        <aside className="sticky top-0 hidden h-[100dvh] w-60 flex-shrink-0 overflow-y-auto border-r border-border bg-background md:block">
          <div className="border-b border-border px-4 py-4">
            <p className="font-display text-base font-bold tracking-tight">Toledo Lokal</p>
            <p className="text-xs text-muted-foreground">City Operating System</p>
          </div>
          {Nav}
        </aside>

        {/* Mobile slide-over */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
            <aside className="absolute left-0 top-0 h-full w-64 overflow-y-auto bg-background shadow-xl safe-area-top-lg">
              <div className="flex items-center justify-between border-b border-border px-4 py-4">
                <div>
                  <p className="font-display text-base font-bold tracking-tight">Toledo Lokal</p>
                  <p className="text-xs text-muted-foreground">City Operating System</p>
                </div>
                <button onClick={() => setMobileOpen(false)} className="rounded-lg p-1 hover:bg-secondary"><X className="h-5 w-5" /></button>
              </div>
              {Nav}
            </aside>
          </div>
        )}

        {/* Content */}
        <main className="min-w-0 flex-1">
          <header className="safe-area-top-lg sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
            <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
              <button onClick={() => setMobileOpen(true)} aria-label="Open menu" className="relative z-10 -ml-1.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg hover:bg-secondary md:hidden"><Menu className="h-5 w-5" /></button>
              <div className="min-w-0">
                <h1 className="truncate font-display text-lg font-bold tracking-tight">{title}</h1>
                {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
              </div>
            </div>
          </header>
          {/* Bottom padding clears BOTH the global fixed-position BottomNav
              (h-16 + its own safe-area-bottom ≈ 98px) and the iOS home
              indicator. We use the same 9rem base every other full-screen
              page uses (Today, Home, PageContainer) plus the .admin-content
              native floor, because env(safe-area-inset-bottom) resolves to 0
              inside the Capacitor WebView — a raw env() inset adds nothing
              there, which is why the City Overview stat cards stayed trapped. */}
          <div className="admin-content p-4 pb-[calc(9rem+env(safe-area-inset-bottom))] sm:p-6 sm:pb-[calc(9rem+env(safe-area-inset-bottom))]">{children}</div>
        </main>
      </div>
    </div>
  );
}
