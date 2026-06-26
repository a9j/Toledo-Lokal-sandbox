import { useState } from 'react';
import { Loader2, Search, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useEligibilityReport, type EligibilityReport } from '@/hooks/useCohortAdmin';

// Launch-day "why did this person get in / get bounced?" tool. Reads the SAME
// server predicate the gate uses (admin_eligibility_report → is_beta_eligible
// arms), so the answer always matches reality.
function Row({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {ok ? (
        <Check className="h-4 w-4 text-emerald-600" />
      ) : (
        <X className="h-4 w-4 text-muted-foreground" />
      )}
      <span className={ok ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
    </div>
  );
}

export function EligibilityInspector() {
  const report = useEligibilityReport();
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<EligibilityReport | null>(null);

  const run = async () => {
    if (!email.trim()) return;
    try {
      const r = await report.mutateAsync(email);
      setResult(r);
    } catch {
      toast.error('Lookup failed. Check your permissions.');
    }
  };

  return (
    <div className="max-w-lg space-y-4">
      <div className="rounded-2xl border border-border/60 bg-card p-5">
        <Label htmlFor="elig-email">Check a user by email</Label>
        <div className="mt-2 flex gap-2">
          <Input
            id="elig-email"
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && run()}
          />
          <Button onClick={run} disabled={report.isPending || !email.trim()}>
            {report.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Shows whether the beta gate lets this person in during the beta window, and why.
        </p>
      </div>

      {result && (
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          {!result.found ? (
            <p className="text-sm text-muted-foreground">No account found for that email.</p>
          ) : (
            <div className="space-y-3">
              <div
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${
                  result.eligible ? 'bg-emerald-500/15 text-emerald-600' : 'bg-destructive/15 text-destructive'
                }`}
              >
                {result.eligible ? 'Eligible — gets in' : 'Not eligible — sees waitlist'}
              </div>
              <div className="space-y-1.5 pt-1">
                <Row ok={!!result.cohort_member} label="Charter 100 cohort member" />
                <Row ok={!!result.founding_business} label="Owns a Founding 5 / Founding 25 business" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
