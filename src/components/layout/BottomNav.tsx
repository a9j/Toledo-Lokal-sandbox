import { NavLink, useLocation } from 'react-router-dom';
import { Home, Radio, Compass, Map, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useCity } from '@/contexts/CityContext';
import { useUnreadCount } from '@/hooks/useCityOs';
import { SOFT_LAUNCH } from '@/lib/flags';

// Phase 0 Step 9: five tabs, each pointing at a screen that already exists.
// No new content was built for them; the old tabs (Featured, Loop, Community,
// Circles) keep their routes and are reachable from the screens that link to
// them, they are just no longer top level.
const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  // Pulse is hidden during soft launch, and the tab goes with it rather than
  // leaving a tab that bounces you home.
  { path: '/pulse', icon: Radio, label: 'Pulse', show: !SOFT_LAUNCH },
  { path: '/explore', icon: Compass, label: 'Explore', match: ['/discover'] },
  { path: '/near-me', icon: Map, label: 'Map' },
  { path: '/my-toledo', icon: User, label: 'MY_CITY_LABEL', match: ['/inbox', '/profile'] },
].filter((item) => item.show !== false);

export function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const { city } = useCity();
  const { data: unread } = useUnreadCount();

  // Hide on auth page, scanner mode, accept invitation, and the unlisted
  // /join marketing pages (which should read as a standalone landing page).
  const hiddenPaths = ['/auth', '/scanner-mode', '/accept-invitation', '/join', '/save', '/beta'];
  if (hiddenPaths.some(path => location.pathname.startsWith(path))) return null;

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
        {/* Frosted glass background */}
        <div className="absolute inset-0 bg-background/85 backdrop-blur-xl border-t border-border/50" />

        <div className="relative flex items-center justify-around h-16 max-w-lg lg:max-w-3xl mx-auto px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            // The last tab is named after the city, so a second city does not
            // ship a tab that says Toledo.
            const label = item.label === 'MY_CITY_LABEL' ? `My ${city.name}` : item.label;
            // Unread civic inbox items live under the last tab.
            const badge = item.path === '/my-toledo' ? (unread ?? 0) : 0;

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
                  "relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-primary/10"
                    : "group-hover:bg-muted"
                )}>
                  <Icon className={cn(
                    "h-5 w-5 transition-all duration-200",
                    isActive && "stroke-[2.25px] text-primary"
                  )} />
                  {badge > 0 && (
                    <span
                      aria-label={`${badge} unread`}
                      className="absolute -top-0.5 right-1 flex h-4 min-w-4 items-center justify-center
                                 rounded-full bg-primary px-1 text-[9px] font-semibold text-primary-foreground"
                    >
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </div>

                <span className={cn(
                  "text-[10px] mt-0.5 font-medium transition-all duration-200",
                  isActive ? "font-semibold text-foreground" : ""
                )}>
                  {label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>

    </>
  );
}
