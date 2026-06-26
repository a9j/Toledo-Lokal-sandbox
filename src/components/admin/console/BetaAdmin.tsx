import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Users, Apple, Smartphone, Send, RefreshCw, Trash2, Plus, Lightbulb,
  Briefcase, ArrowRightLeft, ShieldAlert, QrCode,
} from 'lucide-react';
import {
  useBetaSignupStats, useBetaMembersAdmin, useBetaPhaseAdmin, useBulkInvite,
  useBetaBackfillReport, useBetaBackfillApply, useAddBetaMember, useRemoveBetaMember,
  useRemoveBetaIdea, type BackfillMatch,
} from '@/hooks/useBetaAdmin';
import { useBetaPhase, useBetaIdeas } from '@/hooks/useBeta';
import { JoinQRCode } from '@/components/join/JoinQRCode';
import { siteUrl } from '@/lib/site-url';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

function Section({ title, icon: Icon, children, action }: {
  title: string; icon: React.ElementType; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <h3 className="font-display text-base font-semibold">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

// ── Phase flip ───────────────────────────────────────────────────────────
function PhaseControl() {
  const { data: phase } = useBetaPhase();
  const flip = useBetaPhaseAdmin();
  const isLive = phase === 'cohort_live';
  const next = isLive ? 'open_signup' : 'cohort_live';

  return (
    <Section title="Beta phase" icon={ArrowRightLeft}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm">
            Current phase:{' '}
            <Badge variant="outline" className={isLive ? 'border-emerald-400 text-emerald-600' : 'border-blue-400 text-blue-600'}>
              {isLive ? 'cohort_live' : 'open_signup'}
            </Badge>
          </p>
          <p className="mt-1 max-w-md text-xs text-muted-foreground">
            {isLive
              ? 'Public signups are closed. The Founding Beta cohort, beta job posts, and Ideas are active for members.'
              : 'The public QR page accepts new signups. Flip to cohort_live when the app clears review.'}
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant={isLive ? 'outline' : 'default'} disabled={flip.isPending}>
              {isLive ? 'Reopen public signups' : 'Go live (close public signups)'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Switch beta phase to {next}?</AlertDialogTitle>
              <AlertDialogDescription>
                {next === 'cohort_live'
                  ? 'This closes the public signup page right away and activates the Founding Beta cohort for members.'
                  : 'This reopens the public signup page to new entries.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => flip.mutate(next)}>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Section>
  );
}

// ── Signups + bulk invite ──────────────────────────────────────────────────
function SignupsControl() {
  const { data: stats, isLoading } = useBetaSignupStats();
  const bulkInvite = useBulkInvite();

  const Stat = ({ label, value, icon: Icon }: { label: string; value: number; icon?: React.ElementType }) => (
    <div className="flex items-center gap-2 rounded-xl border border-border/60 px-3 py-2">
      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      <div>
        <p className="text-lg font-semibold leading-none">{value}</p>
        <p className="text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );

  return (
    <Section
      title="Beta signups"
      icon={Users}
      action={
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" className="gap-1.5" disabled={bulkInvite.isPending}>
              <Send className="h-4 w-4" /> Bulk invite all
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Invite everyone who signed up?</AlertDialogTitle>
              <AlertDialogDescription>
                This marks every signup as invited and emails each one their install
                instructions (TestFlight for Apple, install link for Android). People
                already active are left alone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => bulkInvite.mutate()}>Send invites</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      }
    >
      {isLoading || !stats ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Total" value={stats.total} icon={Users} />
          <Stat label="Apple" value={stats.apple} icon={Apple} />
          <Stat label="Android" value={stats.android} icon={Smartphone} />
          <Stat label="Invited" value={stats.invited} />
          <Stat label="Active" value={stats.active} />
          <Stat label="Removed" value={stats.removed} />
        </div>
      )}
    </Section>
  );
}

// ── Members roster + manual add ─────────────────────────────────────────────
function MembersControl() {
  const { data: members, isLoading } = useBetaMembersAdmin();
  const addMember = useAddBetaMember();
  const removeMember = useRemoveBetaMember();
  const [email, setEmail] = useState('');
  const [platform, setPlatform] = useState<'apple' | 'android'>('apple');

  const statusColor: Record<string, string> = {
    active: 'border-emerald-400 text-emerald-600',
    invited: 'border-amber-400 text-amber-600',
    removed: 'border-red-400 text-red-600',
  };

  return (
    <Section title="Members" icon={Users}>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Add member by email"
          className="flex-1"
        />
        <Select value={platform} onValueChange={(v) => setPlatform(v as 'apple' | 'android')}>
          <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="android">Android</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={() => { addMember.mutate({ email, platform }); setEmail(''); }}
          disabled={addMember.isPending || !email.trim()}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : !members?.length ? (
        <p className="text-sm text-muted-foreground">No members yet.</p>
      ) : (
        <div className="max-h-96 space-y-1 overflow-y-auto">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-2 rounded-lg border border-border/40 px-3 py-2 text-sm">
              <div className="min-w-0 flex-1">
                <p className="truncate">{m.email}</p>
                <p className="text-[11px] text-muted-foreground">
                  {m.platform}{m.has_account ? ' · has account' : ''}
                </p>
              </div>
              <Badge variant="outline" className={statusColor[m.status]}>{m.status}</Badge>
              {m.status !== 'removed' && (
                <Button
                  size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                  onClick={() => removeMember.mutate(m.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

// ── Beta job posts ──────────────────────────────────────────────────────────
function BetaJobsControl() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [businessId, setBusinessId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [applyMethod, setApplyMethod] = useState<'email' | 'phone' | 'link'>('email');
  const [applyContact, setApplyContact] = useState('');

  const businesses = useQuery({
    queryKey: ['admin-business-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name')
        .order('name')
        .limit(500);
      if (error) throw error;
      return (data as { id: string; name: string }[]) ?? [];
    },
  });

  const betaJobs = useQuery({
    queryKey: ['admin-beta-jobs'],
    queryFn: async () => {
      // visibility is not yet in the generated types; detype the builder
      // (same pattern as the cohort hooks).
      const { data, error } = await supabase
        .from('jobs' as never)
        .select('id, title, status, business:businesses(name)')
        .eq('visibility', 'beta')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as unknown as { id: string; title: string; status: string; business: { name: string } | null }[]) ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('jobs' as never).insert({
        business_id: businessId,
        title: title.trim(),
        job_type: 'part-time',
        apply_method: applyMethod,
        apply_contact: applyContact.trim(),
        description: description.trim() || null,
        visibility: 'beta',
        status: 'approved',
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-beta-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setTitle(''); setDescription(''); setApplyContact('');
      toast({ title: 'Beta job posted' });
    },
    onError: (e: Error) => toast({ variant: 'destructive', title: 'Could not post', description: e.message }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('jobs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-beta-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast({ title: 'Job removed' });
    },
  });

  const canSubmit = businessId && title.trim() && applyContact.trim();

  return (
    <Section title="Beta-only job posts" icon={Briefcase}>
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Business</Label>
            <Select value={businessId} onValueChange={setBusinessId}>
              <SelectTrigger><SelectValue placeholder="Choose a business" /></SelectTrigger>
              <SelectContent>
                {(businesses.data ?? []).map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Beta role title" maxLength={120} />
          </div>
        </div>
        <div>
          <Label>Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={1000} className="resize-none" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>How to apply</Label>
            <Select value={applyMethod} onValueChange={(v) => setApplyMethod(v as 'email' | 'phone' | 'link')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="link">Link</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Contact</Label>
            <Input value={applyContact} onChange={(e) => setApplyContact(e.target.value)} placeholder="jobs@business.com" />
          </div>
        </div>
        <Button onClick={() => create.mutate()} disabled={!canSubmit || create.isPending} className="gap-1.5">
          <Plus className="h-4 w-4" /> Post beta job
        </Button>
      </div>

      <div className="mt-5 space-y-1">
        {(betaJobs.data ?? []).map((j) => (
          <div key={j.id} className="flex items-center gap-2 rounded-lg border border-border/40 px-3 py-2 text-sm">
            <div className="min-w-0 flex-1">
              <p className="truncate">{j.title}</p>
              <p className="text-[11px] text-muted-foreground">{j.business?.name} · {j.status}</p>
            </div>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove.mutate(j.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ── Ideas moderation ────────────────────────────────────────────────────────
function IdeasModeration() {
  const { ideas, isLoading } = useBetaIdeas(undefined, 'top');
  const removeIdea = useRemoveBetaIdea();

  return (
    <Section title="Ideas moderation" icon={Lightbulb}>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : !ideas.length ? (
        <p className="text-sm text-muted-foreground">No ideas yet.</p>
      ) : (
        <div className="space-y-1">
          {ideas.map((idea) => (
            <div key={idea.id} className="flex items-center gap-2 rounded-lg border border-border/40 px-3 py-2 text-sm">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{idea.title}</p>
                <p className="text-[11px] text-muted-foreground">
                  {idea.vote_count} upvotes · {idea.comment_count} comments · {idea.author?.name ?? 'Member'}
                </p>
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeIdea.mutate(idea.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

// ── Backfill safeguard (report → review → apply) ───────────────────────────
function BackfillControl() {
  const report = useBetaBackfillReport();
  const apply = useBetaBackfillApply();
  const [matches, setMatches] = useState<BackfillMatch[] | null>(null);

  const runReport = async () => {
    const data = await report.mutateAsync();
    setMatches(data);
  };

  return (
    <Section title="Backfill existing signups" icon={ShieldAlert}>
      <p className="mb-3 max-w-2xl text-sm text-muted-foreground">
        Links people who already have an account to the cohort. This runs a dry-run
        report first. Review the matches below, then apply. Nothing is linked until
        you press Apply.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" className="gap-1.5" onClick={runReport} disabled={report.isPending}>
          <RefreshCw className="h-4 w-4" /> Run report
        </Button>
        {matches && matches.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={apply.isPending}>Apply ({matches.length})</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Link {matches.length} existing account(s)?</AlertDialogTitle>
                <AlertDialogDescription>
                  This sets each matched signup to an active beta member. It only
                  touches the accounts shown in the report.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => apply.mutate(undefined, { onSuccess: () => setMatches(null) })}>
                  Apply backfill
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {matches && (
        <div className="mt-4">
          {matches.length === 0 ? (
            <p className="text-sm text-muted-foreground">No unlinked matches. Everyone with an account is already linked.</p>
          ) : (
            <div className="max-h-72 space-y-1 overflow-y-auto">
              {matches.map((m) => (
                <div key={m.matched_user_id} className="rounded-lg border border-border/40 px-3 py-2 text-sm">
                  <p className="truncate">{m.signup_email}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {m.platform} · matches account {m.matched_user_email}
                    {m.current_status ? ` · currently ${m.current_status}` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Section>
  );
}

// ── Share the closed-beta signup (QR + link) ───────────────────────────────
function ShareSignupControl() {
  const { data: phase } = useBetaPhase();
  const signupUrl = siteUrl('/beta.html');
  return (
    <Section title="Share the signup" icon={QrCode}>
      <p className="mb-4 max-w-xl text-sm text-muted-foreground">
        Send this QR code or link to invite people to the closed beta signup page.
        They pick their phone and leave their email. {phase === 'cohort_live'
          ? 'Heads up: the phase is cohort_live, so the public page is closed to new signups right now.'
          : 'New signups are open while the phase is open_signup.'}
      </p>
      <JoinQRCode url={signupUrl} />
    </Section>
  );
}

export function BetaAdmin() {
  return (
    <div className="space-y-5">
      <ShareSignupControl />
      <PhaseControl />
      <SignupsControl />
      <MembersControl />
      <BetaJobsControl />
      <IdeasModeration />
      <BackfillControl />
    </div>
  );
}
