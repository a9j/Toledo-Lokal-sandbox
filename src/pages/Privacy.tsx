import { Link, useNavigate } from 'react-router-dom';
import { Home, Navigation, Sparkles, Bot, Eye, Award, type LucideIcon } from 'lucide-react';
import { ArrowLeft, LogIn, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useCity } from '@/contexts/CityContext';
import { usePrivacy, type PrivacySetting } from '@/hooks/usePrivacy';

interface Row {
  key: PrivacySetting;
  label: string;
  help: string;
  warning?: string;
  icon: LucideIcon;
}

const ROWS: Row[] = [
  {
    key: 'store_home_address',
    icon: Home,
    label: 'Keep my address',
    help: 'Lets you save your home so we can show what is happening on your street.',
    warning: 'Turning this off deletes the address we have. We do not keep a copy.',
  },
  {
    key: 'share_location',
    icon: Navigation,
    label: 'Use where I am',
    help: 'Sorts results by how close they are to your home.',
  },
  {
    key: 'personalization',
    icon: Sparkles,
    label: 'Learn what I like',
    help: 'Uses what you follow and open to pick what to show first.',
  },
  {
    key: 'ai_recommendations',
    icon: Bot,
    label: 'Let AI suggest things',
    help: 'Allows suggestions written by AI from your activity.',
  },
  {
    key: 'public_activity',
    icon: Eye,
    label: 'Show my activity',
    help: 'Lets other people see what you follow and post.',
  },
  {
    key: 'public_rewards',
    icon: Award,
    label: 'Show my rewards',
    help: 'Puts your points and badges on your public profile.',
  },
];

export default function Privacy() {
  const { user, isLoading: authLoading } = useAuth();
  const { city } = useCity();
  const navigate = useNavigate();
  const { settings, isLoading, setSetting, isSaving } = usePrivacy();

  if (authLoading || (user && isLoading)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-heading text-lg font-semibold">Sign in to change this</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Until you do, we keep nothing about you.
        </p>
        <Button asChild className="mt-5">
          <Link to="/auth"><LogIn className="mr-1.5 h-4 w-4" />Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <h1 className="font-heading text-2xl font-semibold tracking-tight">Privacy</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Every one of these starts off. Nothing turns itself on.
      </p>

      <div className="mt-4 flex gap-3 rounded-xl border border-border/60 bg-muted/40 p-4">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-sm leading-snug text-muted-foreground">
          {city.name} Lokal will not use your address or your location for anything
          until you say so here. If you turn something off later, we stop and we
          delete what that switch was keeping.
        </p>
      </div>

      <div className="mt-5 divide-y divide-border/50 overflow-hidden rounded-2xl border border-border/60 bg-card">
        {ROWS.map((row) => {
          const on = settings[row.key] === true;
          const Icon = row.icon;
          return (
            <div key={row.key} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 gap-3">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                  <label htmlFor={row.key} className="text-sm font-semibold">
                    {row.label}
                  </label>
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{row.help}</p>
                  {on && row.warning && (
                    <p className="mt-1.5 text-xs leading-snug text-muted-foreground">
                      {row.warning}
                    </p>
                  )}
                  </div>
                </div>
                <Switch
                  id={row.key}
                  checked={on}
                  disabled={isSaving}
                  onCheckedChange={(next) =>
                    setSetting(
                      { setting: row.key, value: next },
                      {
                        onSuccess: () =>
                          toast.success(
                            next
                              ? `${row.label} is on.`
                              : row.key === 'store_home_address'
                                ? 'Off. Your address has been deleted.'
                                : `${row.label} is off.`,
                          ),
                        onError: (e: Error) =>
                          toast.error(e.message || 'That did not save. Try again.'),
                      },
                    )
                  }
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-xs leading-snug text-muted-foreground">
        How often we tell you about changes is on the{' '}
        <Link to="/settings/notifications" className="font-medium text-primary">
          notifications
        </Link>{' '}
        screen.
      </p>
    </div>
  );
}
