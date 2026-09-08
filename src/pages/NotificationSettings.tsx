import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationPreferences, useSetNotificationPreference } from '@/hooks/useCityOs';

const CADENCES = [
  { value: 'immediate', label: 'Right away' },
  { value: 'daily',     label: 'Once a day' },
  { value: 'weekly',    label: 'Once a week' },
  { value: 'off',       label: 'Never' },
];

export default function NotificationSettings() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: prefs, isLoading } = useNotificationPreferences();
  const setPref = useSetNotificationPreference();

  if (authLoading || isLoading) {
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
        <Button asChild className="mt-5">
          <Link to="/auth"><LogIn className="mr-1.5 h-4 w-4" />Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-6">
      <button
        onClick={() => navigate('/inbox')}
        className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Inbox
      </button>

      <h1 className="font-heading text-2xl font-semibold tracking-tight">How often we tell you</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Pick one for each kind of news. Everything shows up in your inbox either way.
        This is about when we round it up for you.
      </p>

      <div className="mt-3 rounded-xl border border-border/60 bg-muted/40 p-4">
        <p className="text-sm leading-snug text-muted-foreground">
          Nothing is pushed to your phone yet. Daily and weekly round ups are built and
          saved, and there is no sender wired up to them.
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {(prefs ?? []).map((pref) => (
          <div key={pref.category} className="rounded-xl border border-border/60 bg-card p-4">
            <p className="text-sm font-semibold">{pref.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{pref.description}</p>

            <div
              className="mt-3 flex flex-wrap gap-1.5"
              role="radiogroup"
              aria-label={`How often for ${pref.label}`}
            >
              {CADENCES.map((cadence) => {
                const active = pref.cadence === cadence.value;
                return (
                  <button
                    key={cadence.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={setPref.isPending}
                    onClick={() =>
                      setPref.mutate(
                        { category: pref.category, cadence: cadence.value },
                        {
                          onError: (e: Error) =>
                            toast.error(e.message || 'That did not save. Try again.'),
                        },
                      )
                    }
                    className={
                      'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ' +
                      (active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border/60 bg-background text-muted-foreground hover:bg-muted')
                    }
                  >
                    {cadence.label}
                  </button>
                );
              })}
            </div>

            {pref.cadence === 'immediate' && (
              <p className="mt-2 text-xs text-muted-foreground">
                Right away needs a push channel, which is not built yet. For now this
                behaves like once a day.
              </p>
            )}
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs leading-snug text-muted-foreground">
        You can also turn off what we keep about you on the{' '}
        <Link to="/settings/privacy" className="font-medium text-primary">Privacy</Link> screen.
      </p>
    </div>
  );
}
