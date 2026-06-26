import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, ShieldCheck, Users, AlertTriangle } from 'lucide-react';
import type { DuplicateMatch, VerificationMethod } from '@/hooks/useBusinessClaim';

interface ClaimBusinessPromptProps {
  matches: DuplicateMatch[];
  /** Caller's email, used to offer email-domain verification when it lines up. */
  userEmail?: string | null;
  claiming?: boolean;
  onClaim: (businessId: string, method: VerificationMethod) => void;
  /** Let the user dismiss and create a genuinely new business (e.g. same name,
   *  different location). */
  onDismiss?: () => void;
}

// Shown during onboarding when a name(+address) match is found. Blocks creating
// a duplicate and routes the user into the claim flow instead.
export function ClaimBusinessPrompt({
  matches,
  userEmail,
  claiming,
  onClaim,
  onDismiss,
}: ClaimBusinessPromptProps) {
  const [selectedId, setSelectedId] = useState<string | null>(matches[0]?.id ?? null);

  const selected = matches.find((m) => m.id === selectedId) ?? matches[0];
  if (!selected) return null;

  // Offer email-domain verification only when it could plausibly succeed.
  const emailDomain = userEmail?.split('@')[1]?.toLowerCase() ?? '';

  return (
    <Card className="border-lokal-amber/40 bg-lokal-amber/5 p-4 space-y-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-lokal-amber shrink-0 mt-0.5" />
        <div>
          <h3 className="font-heading font-semibold text-foreground">
            This business may already be on Toledo Lokal
          </h3>
          <p className="text-sm text-muted-foreground">
            To avoid duplicate profiles, claim the existing one if it's yours.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {matches.map((m) => {
          const isSel = m.id === selected.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedId(m.id)}
              className={`w-full text-left rounded-lg border p-3 transition-colors ${
                isSel
                  ? 'border-lokal-amber bg-background'
                  : 'border-border bg-background/60 hover:border-lokal-amber/50'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 font-medium text-foreground">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  {m.name}
                </span>
                <div className="flex items-center gap-1">
                  {m.has_owner ? (
                    <Badge variant="secondary" className="text-xs">
                      <ShieldCheck className="h-3 w-3 mr-1" /> Has owner
                    </Badge>
                  ) : m.has_manager ? (
                    <Badge variant="outline" className="text-xs">
                      <Users className="h-3 w-3 mr-1" /> Managed
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">Unclaimed</Badge>
                  )}
                </div>
              </div>
              {(m.street_address || m.address) && (
                <span className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {m.street_address || m.address}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selected.has_owner ? (
        <p className="text-sm text-muted-foreground">
          This business already has an owner. If you believe this is a mistake,
          contact support — you can't claim ownership of an already-owned profile.
        </p>
      ) : (
        <div className="space-y-2">
          {selected.has_manager && (
            <p className="text-xs text-muted-foreground">
              A manager is already running this profile. Your owner claim will be
              sent to them (or an admin) for approval.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={claiming}
              onClick={() => onClaim(selected.id, 'manual_confirmation')}
            >
              {claiming ? 'Submitting…' : "This is my business — claim it"}
            </Button>
            {emailDomain && (
              <Button
                size="sm"
                variant="outline"
                disabled={claiming}
                onClick={() => onClaim(selected.id, 'email_domain')}
              >
                Verify with my work email
              </Button>
            )}
          </div>
        </div>
      )}

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          None of these — my business is different
        </button>
      )}
    </Card>
  );
}
