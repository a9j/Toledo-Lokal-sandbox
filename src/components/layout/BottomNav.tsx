import { NavLink, useLocation } from 'react-router-dom';
import { Newspaper, MapPin, Compass, Radio, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { path: '/', icon: Newspaper, label: 'Today' },
  { path: '/near-me', icon: MapPin, label: 'Near Me' },
  { path: '/discover', icon: Compass, label: 'Discover' },
  { path: '/pulse', icon: Radio, label: 'Pulse' },
  { path: '/loop', icon: Repeat, label: 'Loop' },
];

export function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();

  // Hide on auth page, scanner mode, and accept invitation pages
  const hiddenPaths = ['/auth', '/scanner-mode', '/accept-invitation'];
  if (hiddenPaths.some(path => location.pathname.startsWith(path))) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      {/* Frosted glass background */}
      <div className="absolute inset-0 bg-background/85 backdrop-blur-xl border-t border-border/50" />
      
      <div className="relative flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));
          const Icon = item.icon;
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
  );
}