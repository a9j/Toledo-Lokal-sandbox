import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { MapPin, Compass, Radio, Repeat, HeartHandshake, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { LP_ENABLED, SOFT_LAUNCH } from '@/lib/flags';
import { ComingSoonModal } from '@/components/layout/ComingSoonModal';

const navItems = [
  { path: '/discover', icon: Compass, label: 'Discover' },
  { path: '/near-me', icon: MapPin, label: 'Near Me' },
  { path: '/pulse', icon: Radio, label: 'Pulse', show: !SOFT_LAUNCH },
  { path: '/loop', icon: Repeat, label: 'Loop', locked: !LP_ENABLED },
  { path: '/community', icon: HeartHandshake, label: 'Community' },
].filter((item) => item.show !== false);

export function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const [comingSoonOpen, setComingSoonOpen] = useState(false);

  // Hide on auth page, scanner mode, accept invitation, and the unlisted
  // /join marketing pages (which should read as a standalone landing page).
  const hiddenPaths = ['/auth', '/scanner-mode', '/accept-invitation', '/join', '/save'];
  if (hiddenPaths.some(path => location.pathname.startsWith(path))) return null;

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
        {/* Frosted glass background */}
        <div className="absolute inset-0 bg-background/85 backdrop-blur-xl border-t border-border/50" />

        <div className="relative flex items-center justify-around h-16 max-w-lg lg:max-w-3xl mx-auto px-2">
          {navItems.map((item) => {
            const Icon = item.icon;

            // Locked tabs (e.g. Today, Loop) show a Coming Soon modal instead
            // of navigating, until their feature flag flips on.
            if (item.locked) {
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => setComingSoonOpen(true)}
                  aria-label={`${item.label} (coming soon)`}
                  className="flex flex-col items-center justify-center flex-1 py-2 transition-all duration-200 relative group text-muted-foreground/50"
                >
                  <div className="relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 group-hover:bg-muted">
                    <Icon className="h-5 w-5" />
                    <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-muted-foreground/70 text-background">
                      <Lock className="h-2 w-2" strokeWidth={3} />
                    </span>
                  </div>
                  <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
                </button>
              );
            }

            const matchPaths = [item.path, ...(item.match ?? [])];
            const isActive = matchPaths.some((path) =>
              location.pathname === path ||
              (path !== '/' && location.pathname.startsWith(path)));
            const to = item.path === '/profile' && !user ? '/auth' : item.path;

            return (
              <NavLink
                key={item.path}
                to={to}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 py-2 transition-all duration-200 relative group",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {/* Active indicator dot */}
                {isActive && (
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}

                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-primary/10"
                    : "group-hover:bg-muted"
                )}>
                  <Icon className={cn(
                    "h-5 w-5 transition-all duration-200",
                    isActive && "stroke-[2.25px] text-primary"
                  )} />
                </div>

                <span className={cn(
                  "text-[10px] mt-0.5 font-medium transition-all duration-200",
                  isActive ? "font-semibold text-foreground" : ""
                )}>
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      <ComingSoonModal open={comingSoonOpen} onOpenChange={setComingSoonOpen} />
    </>
  );
}
