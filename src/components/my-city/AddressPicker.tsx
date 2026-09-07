import { useState } from 'react';
import { MapPin, Loader2, Check, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useParcelSearch, useSetHomeParcel, type ParcelMatch } from '@/hooks/useMyCity';

interface AddressPickerProps {
  /** Called once the home is saved. */
  onSaved?: (parcel: ParcelMatch) => void;
  /** Onboarding shows a skip; settings does not. */
  onSkip?: () => void;
  autoFocus?: boolean;
}

/**
 * Type an address, match it against the parcel table, save it as home.
 *
 * Saving also follows the home and its neighborhood, which the database does,
 * so their changes start arriving in the Civic Inbox straight away.
 */
export function AddressPicker({ onSaved, onSkip, autoFocus }: AddressPickerProps) {
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<ParcelMatch | null>(null);

  const { data: matches, isFetching } = useParcelSearch(picked ? '' : query);
  const setHome = useSetHomeParcel();

  const save = (parcel: ParcelMatch) => {
    setHome.mutate(parcel.id, {
      onSuccess: () => {
        setPicked(parcel);
        toast.success('Home saved. You are now following your street and neighborhood.');
        onSaved?.(parcel);
      },
      onError: () => toast.error('Could not save that address. Please try again.'),
    });
  };

  if (picked) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Check className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">{picked.address}</p>
            {picked.neighborhood_name && (
              <p className="mt-0.5 text-xs text-muted-foreground">{picked.neighborhood_name}</p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 w-full"
          onClick={() => {
            setPicked(null);
            setQuery('');
          }}
        >
          Use a different address
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Start typing your street address"
          className="pl-9"
          autoFocus={autoFocus}
          autoComplete="street-address"
          aria-label="Your home address"
        />
        {isFetching && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {query.trim().length >= 2 && matches && matches.length === 0 && !isFetching && (
        <p className="px-1 text-sm text-muted-foreground">
          No match yet. Try just the house number and street.
        </p>
      )}

      {matches && matches.length > 0 && (
        <ul className="space-y-1.5">
          {matches.map((match) => (
            <li key={match.id}>
              <button
                type="button"
                onClick={() => save(match)}
                disabled={setHome.isPending}
                className="flex w-full items-center gap-3 rounded-xl border border-border/60 bg-card p-3 text-left transition-colors hover:border-border hover:bg-muted/40 disabled:opacity-60"
              >
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{match.address}</span>
                  {match.neighborhood_name && (
                    <span className="block text-xs text-muted-foreground">
                      {match.neighborhood_name}
                    </span>
                  )}
                </span>
                {setHome.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              </button>
            </li>
          ))}
        </ul>
      )}

      {onSkip && (
        <Button variant="ghost" size="sm" className="w-full" onClick={onSkip}>
          Skip for now
        </Button>
      )}
    </div>
  );
}
