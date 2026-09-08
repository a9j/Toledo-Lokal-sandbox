import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ExternalLink,
  Phone,
  AlertTriangle,
  LogIn,
  ChevronDown,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { useAuth } from '@/contexts/AuthContext';
import {
  useOpportunityMatches,
  useResidentProfile,
  useSaveResidentProfile,
  useLifeEvents,
  isUnverified,
  type OpportunityMatch,
  type LifeEvent,
} from '@/hooks/useCityHelp';

const YES_NO_FIELDS = [
  { key: 'homeowner', label: 'I own my home' },
  { key: 'renter', label: 'I rent' },
  { key: 'senior', label: 'I am 60 or over' },
  { key: 'veteran', label: 'I am a veteran' },
  { key: 'has_children', label: 'I have children' },
  { key: 'business_owner', label: 'I run a business' },
] as const;

const INCOME_BANDS = ['<30k', '30-60k', '60-100k', '100k+'] as const;

function OpportunityCard({ opportunity }: { opportunity: OpportunityMatch }) {
  const unverified = isUnverified(opportunity);

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        {opportunity.category && (
          <Badge variant="secondary" className="text-[10px] capitalize">
            {opportunity.category.replace(/_/g, ' ')}
          </Badge>
        )}
        {opportunity.matched_on.map((m) => (
          <Badge key={m} variant="outline" className="text-[10px] capitalize">
            {m}
          </Badge>
        ))}
      </div>

      <p className="mt-2 text-sm font-semibold leading-snug">{opportunity.title}</p>
      {opportunity.provider && (
        <p className="mt-0.5 text-xs text-muted-foreground">{opportunity.provider}</p>
      )}
      {opportunity.description && (
        <p className="mt-1.5 text-sm leading-snug text-muted-foreground">
          {opportunity.description}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {opportunity.url && (
          <Button asChild size="sm" variant="outline">
            <a href={opportunity.url} target="_blank" rel="noopener noreferrer">
              Open
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </a>
          </Button>
        )}
        {opportunity.phone && (
          <Button asChild size="sm" variant="ghost">
            <a href={`tel:${opportunity.phone}`}>
              <Phone className="mr-1.5 h-3.5 w-3.5" />
              {opportunity.phone}
            </a>
          </Button>
        )}
      </div>

      {/* Nobody has opened these links yet, and someone acting on one may be in
          real trouble. Say so on every card rather than once at the top. */}
      {unverified && (
        <p className="mt-3 rounded-lg bg-muted/60 px-3 py-2 text-xs leading-snug text-muted-foreground">
          We have not confirmed this listing. Check with the provider before you rely on it.
        </p>
      )}
    </div>
  );
}

export default function Opportunities() {
  const { user } = useAuth();
  const { data: matches, isLoading } = useOpportunityMatches();
  const { data: profile } = useResidentProfile();
  const { data: lifeEvents } = useLifeEvents();
  const save = useSaveResidentProfile();

  const [showProfile, setShowProfile] = useState(false);
  const [openEvent, setOpenEvent] = useState<LifeEvent | null>(null);

  if (!user) {
    return (
      <>
        <Header title="Opportunities" showBack />
        <PageContainer>
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <Sparkles className="h-6 w-6 text-muted-foreground" />
            </div>
            <h1 className="font-heading text-lg font-semibold">Sign in to see what you qualify for</h1>
            <Button asChild className="mt-5">
              <Link to="/auth">
                <LogIn className="mr-1.5 h-4 w-4" />
                Sign in
              </Link>
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  const count = matches?.length ?? 0;
  const knowsNothing = matches?.[0]?.missing_info ?? true;

  const toggle = (key: string, value: boolean) => {
    save.mutate(
      { [key]: value },
      { onError: () => toast.error('Could not save that. Please try again.') },
    );
  };

  const selectedEvents = profile?.life_events ?? [];

  const toggleLifeEvent = (key: string) => {
    const next = selectedEvents.includes(key)
      ? selectedEvents.filter((e) => e !== key)
      : [...selectedEvents, key];
    save.mutate(
      { life_events: next },
      { onError: () => toast.error('Could not save that. Please try again.') },
    );
  };

  return (
    <>
      <Header title="Opportunities" showBack />
      <PageContainer>
        <div className="mb-5">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {knowsNothing
              ? `${count} things you might qualify for`
              : `You may qualify for ${count} things`}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {knowsNothing
              ? 'Tell us a little about yourself and this list gets shorter and more useful.'
              : 'Based on what you told us. Everything is optional and you can change it any time.'}
          </p>
        </div>

        {/* Life events. Picking one filters the list and shows a checklist. */}
        {lifeEvents && lifeEvents.events.length > 0 && (
          <div className="mb-5">
            <h2 className="mb-2 text-sm font-semibold">Anything changed lately?</h2>
            <div className="flex flex-wrap gap-2">
              {lifeEvents.events.map((event) => {
                const on = selectedEvents.includes(event.key);
                return (
                  <button
                    key={event.key}
                    type="button"
                    onClick={() => {
                      toggleLifeEvent(event.key);
                      setOpenEvent(on ? null : event);
                    }}
                    className={
                      'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ' +
                      (on
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/60 bg-card hover:bg-muted/40')
                    }
                  >
                    {on && <Check className="mr-1 inline h-3 w-3" />}
                    {event.label}
                  </button>
                );
              })}
            </div>

            {openEvent && (
              <div className="mt-3 rounded-xl border border-border/60 bg-card p-4">
                <h3 className="text-sm font-semibold">{openEvent.label}</h3>
                <ul className="mt-2 space-y-1.5">
                  {openEvent.steps.map((step) => (
                    <li key={step} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                      {step}
                    </li>
                  ))}
                </ul>
                {lifeEvents.note && (
                  <p className="mt-3 text-xs leading-snug text-muted-foreground">{lifeEvents.note}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Optional profile. Skipping it never hides anything. */}
        <div className="mb-5 rounded-xl border border-border/60 bg-card">
          <button
            type="button"
            onClick={() => setShowProfile((v) => !v)}
            className="flex w-full items-center gap-3 p-4 text-left"
          >
            <div className="flex-1">
              <p className="text-sm font-semibold">About you</p>
              <p className="text-xs text-muted-foreground">
                Optional. Only you can see this.
              </p>
            </div>
            <ChevronDown
              className={'h-4 w-4 text-muted-foreground transition-transform ' + (showProfile ? 'rotate-180' : '')}
            />
          </button>

          {showProfile && (
            <div className="space-y-4 border-t border-border/60 p-4">
              <div className="space-y-2">
                {YES_NO_FIELDS.map((field) => {
                  const value = profile?.[field.key] ?? null;
                  return (
                    <div key={field.key} className="flex items-center gap-3">
                      <span className="flex-1 text-sm">{field.label}</span>
                      <div className="flex gap-1.5">
                        {[true, false].map((v) => (
                          <button
                            key={String(v)}
                            type="button"
                            onClick={() => toggle(field.key, v)}
                            className={
                              'rounded-lg border px-3 py-1 text-xs font-medium transition-colors ' +
                              (value === v
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border/60 bg-card hover:bg-muted/40')
                            }
                          >
                            {v ? 'Yes' : 'No'}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <p className="mb-2 text-sm">Household income</p>
                <div className="flex flex-wrap gap-1.5">
                  {INCOME_BANDS.map((band) => (
                    <button
                      key={band}
                      type="button"
                      onClick={() =>
                        save.mutate(
                          { income_band: band },
                          { onError: () => toast.error('Could not save that.') },
                        )
                      }
                      className={
                        'rounded-lg border px-3 py-1 text-xs font-medium transition-colors ' +
                        (profile?.income_band === band
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border/60 bg-card hover:bg-muted/40')
                      }
                    >
                      {band}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs leading-snug text-muted-foreground">
                This is stored against your account only. It is never shown to anyone else,
                including staff.
              </p>
            </div>
          )}
        </div>

        <div className="mb-4 flex gap-3 rounded-xl border border-border/60 bg-muted/50 p-3.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-xs leading-snug text-muted-foreground">
            These listings point at real organisations, but nobody here has confirmed the links
            or the current rules. Always check with the provider before you rely on one.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : count === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nothing matched. Try clearing a detail above.
          </p>
        ) : (
          <div className="space-y-3">
            {matches!.map((match) => (
              <OpportunityCard key={match.id} opportunity={match} />
            ))}
          </div>
        )}
      </PageContainer>
    </>
  );
}
