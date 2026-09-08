import { Link } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMyHome } from '@/hooks/useMyCity';
import { MyCityCards } from '@/components/my-city/MyCityCards';

/**
 * My City on the Home tab.
 *
 * For a resident with an address, the Home tab leads with their own city:
 * trash day, their neighborhood, their district, what changed near them. The
 * Daily Drop still follows underneath, and signed out visitors see the tab
 * exactly as before.
 */
export function MyCityHomeSection() {
  const { user } = useAuth();
  const { data: home, isLoading } = useMyHome();

  if (!user || isLoading) return null;

  // No address yet: one quiet prompt, not a wall.
  if (!home) {
    return (
      <Link
        to="/my-city"
        className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 transition-all hover:border-primary/40 hover:bg-primary/5"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/12">
          <Home className="h-5 w-5 text-primary" strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground">Set up My City</p>
          <p className="text-[12px] text-muted-foreground">
            Add your address for your trash day and what is changing nearby
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground/60 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
      </Link>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-heading text-lg font-semibold tracking-tight">My City</h2>
        <Link to="/my-city" className="text-xs font-medium text-primary hover:underline">
          Manage
        </Link>
      </div>
      <MyCityCards />
    </section>
  );
}
