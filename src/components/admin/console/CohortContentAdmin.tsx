import { useEffect, useState } from 'react';
import { Loader2, Search, Award, Ban, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { BETA_WINDOW_ENABLED } from '@/lib/flags';
import { useAuth } from '@/contexts/AuthContext';
import {
  useEligibilityReport, useAwardBadge, useRevokeBadge,
  useAdminPinnedPost, useUpsertPinnedPost,
  type AdminCohort,
} from '@/hooks/useCohortAdmin';

const BADGE_KEY = 'charter100';

// Badge comps/corrections. Resolve the user by email (reusing the eligibility
// RPC, which returns user_id), then award/revoke the platform-wide badge.
export function BadgeControl() {
  const lookup = useEligibilityReport();
  const award = useAwardBadge();
  const revoke = useRevokeBadge();
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  const find = async () => {
    if (!email.trim()) return;
    try {
      const r = await lookup.mutateAsync(email);
      if (!r.found || !r.user_id) {
        setUserId(null);
        toast.error('No account found for that email.');
        return;
      }
      setUserId(r.user_id);
    } catch {
      toast.error('Lookup failed.');
    }
  };

  const doAward = async () => {
    if (!userId) return;
    try {
      await award.mutateAsync({ userId, badgeKey: BADGE_KEY });
      toast.success('Badge awarded');
    } catch {
      toast.error('Could not award badge.');
    }
  };
  const doRevoke = async () => {
    if (!userId) return;
    try {
      await revoke.mutateAsync({ userId, badgeKey: BADGE_KEY });
      toast.success('Badge revoked');
    } catch {
      toast.error('Could not revoke badge.');
    }
  };

  return (
    <div className="max-w-lg rounded-2xl border border-border/60 bg-card p-5">
      <h3 className="mb-1 font-display text-base font-semibold">Charter 100 badge</h3>
      <p className="mb-3 text-xs text-muted-foreground">
        Award or revoke the permanent badge for comps and corrections. This is the
        identity badge only — it does not change cohort membership.
      </p>
      <Label htmlFor="badge-email">User email</Label>
      <div className="mt-2 flex gap-2">
        <Input id="badge-email" type="email" placeholder="you@email.com" value={email}
          onChange={(e) => { setEmail(e.target.value); setUserId(null); }}
          onKeyDown={(e) => e.key === 'Enter' && find()} />
        <Button onClick={find} disabled={lookup.isPending || !email.trim()}>
          {lookup.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>
      {userId && (
        <div className="mt-4 flex gap-2">
          <Button size="sm" onClick={doAward} disabled={award.isPending}>
            <Award className="mr-1 h-4 w-4" /> Award
          </Button>
          <Button size="sm" variant="outline" className="text-destructive" onClick={doRevoke} disabled={revoke.isPending}>
            <Ban className="mr-1 h-4 w-4" /> Revoke
          </Button>
        </div>
      )}
    </div>
  );
}

// Admin-authored "What's coming" pinned card for the cohort page.
function PinnedEditor({ cohort }: { cohort: AdminCohort }) {
  const { user } = useAuth();
  const { data: pinned, isLoading } = useAdminPinnedPost(cohort.id);
  const upsert = useUpsertPinnedPost();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    setTitle(pinned?.title ?? "What's coming");
    setBody(pinned?.body ?? '');
  }, [pinned?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Title and body are required.');
      return;
    }
    try {
      await upsert.mutateAsync({ id: pinned?.id, cohortId: cohort.id, title: title.trim(), body: body.trim(), updatedBy: user?.id ?? null });
      toast.success('Pinned card saved');
    } catch {
      toast.error('Could not save. Check your permissions.');
    }
  };

  return (
    <div className="max-w-lg space-y-3 rounded-2xl border border-border/60 bg-card p-5">
      <h3 className="font-display text-base font-semibold">"What's coming" pinned card</h3>
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="pin-title">Title</Label>
            <Input id="pin-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pin-body">Body</Label>
            <Textarea id="pin-body" rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <Button onClick={save} disabled={upsert.isPending}>
            {upsert.isPending ? 'Saving…' : 'Save'}
          </Button>
        </>
      )}
    </div>
  );
}

// Read-only beta-gate state. The gate is an env-var flag by design (no DB-backed
// runtime flag) — flipping it is a documented redeploy, not a button.
function GateIndicator() {
  const on = BETA_WINDOW_ENABLED;
  return (
    <div className="max-w-lg rounded-2xl border border-border/60 bg-card p-5">
      <h3 className="mb-2 font-display text-base font-semibold">Beta access gate</h3>
      <div
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${
          on ? 'bg-amber-500/15 text-amber-600' : 'bg-emerald-500/15 text-emerald-600'
        }`}
      >
        {on ? <ShieldAlert className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
        {on ? 'ON — only beta-eligible users can enter' : 'OFF — app open to everyone'}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Controlled by the <code>VITE_BETA_WINDOW_ENABLED</code> env var. To change
        it, set the variable in Vercel (<code>true</code> to close the app to the
        beta cohort, unset/<code>false</code> to open it) and redeploy. There is no
        DB-backed runtime flag by design.
      </p>
    </div>
  );
}

export function CohortContentAdmin({ cohort }: { cohort: AdminCohort }) {
  return (
    <div className="space-y-6">
      <BadgeControl />
      <PinnedEditor cohort={cohort} />
      <GateIndicator />
    </div>
  );
}
