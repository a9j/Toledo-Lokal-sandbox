import { useEffect, useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  useAdminCohorts, useCohortMembers, useUpdateCohort, useRemoveCohortMember,
  type AdminCohort, type CohortMemberRow,
} from '@/hooks/useCohortAdmin';
import { CohortInvites } from './CohortInvites';

// One "Cohorts" console surface. Platform-admin only (AdminConsole gates), but
// every write is also server-gated by can_manage_community / is_platform_admin,
// so stewards work too if they ever reach the console.
export function CohortAdmin() {
  const { data: cohorts, isLoading } = useAdminCohorts();
  const [cohortId, setCohortId] = useState<string | null>(null);

  useEffect(() => {
    if (!cohortId && cohorts && cohorts.length > 0) setCohortId(cohorts[0].id);
  }, [cohorts, cohortId]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading cohorts…
      </div>
    );
  }
  if (!cohorts || cohorts.length === 0) {
    return <p className="text-sm text-muted-foreground">No cohorts yet.</p>;
  }

  const cohort = cohorts.find((c) => c.id === cohortId) ?? cohorts[0];

  return (
    <div className="space-y-5">
      {cohorts.length > 1 && (
        <div className="max-w-xs">
          <Label className="mb-1 block text-xs text-muted-foreground">Cohort</Label>
          <Select value={cohort.id} onValueChange={setCohortId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {cohorts.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="invites">Invites</TabsTrigger>
        </TabsList>
        <TabsContent value="settings" className="pt-4">
          <CohortSettings cohort={cohort} />
        </TabsContent>
        <TabsContent value="members" className="pt-4">
          <CohortMembers cohort={cohort} />
        </TabsContent>
        <TabsContent value="invites" className="pt-4">
          <CohortInvites cohort={cohort} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CohortSettings({ cohort }: { cohort: AdminCohort }) {
  const update = useUpdateCohort();
  const [name, setName] = useState(cohort.name);
  const [mission, setMission] = useState(cohort.mission ?? '');
  const [accessType, setAccessType] = useState(cohort.access_type);
  const [cap, setCap] = useState<string>(cohort.member_cap?.toString() ?? '');
  const [status, setStatus] = useState(cohort.status);

  // Re-sync when the selected cohort changes.
  useEffect(() => {
    setName(cohort.name);
    setMission(cohort.mission ?? '');
    setAccessType(cohort.access_type);
    setCap(cohort.member_cap?.toString() ?? '');
    setStatus(cohort.status);
  }, [cohort.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    try {
      await update.mutateAsync({
        id: cohort.id,
        name: name.trim(),
        mission: mission.trim() || null,
        access_type: accessType,
        member_cap: cap.trim() === '' ? null : Math.max(1, Number(cap)),
        status,
      });
      toast.success('Cohort updated');
    } catch {
      toast.error('Could not update. Check your permissions.');
    }
  };

  return (
    <div className="max-w-lg space-y-4 rounded-2xl border border-border/60 bg-card p-5">
      <div className="space-y-1.5">
        <Label htmlFor="c-name">Name</Label>
        <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="c-mission">Mission</Label>
        <Textarea id="c-mission" rows={3} value={mission} onChange={(e) => setMission(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Access</Label>
          <Select value={accessType} onValueChange={(v) => setAccessType(v as AdminCohort['access_type'])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-cap">Member cap</Label>
          <Input id="c-cap" type="number" min={1} value={cap}
            placeholder="uncapped" onChange={(e) => setCap(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Status</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as AdminCohort['status'])}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="forming">Forming</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="full">Full</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button onClick={save} disabled={update.isPending}>
        {update.isPending ? 'Saving…' : 'Save changes'}
      </Button>
    </div>
  );
}

function CohortMembers({ cohort }: { cohort: AdminCohort }) {
  const { data: members, isLoading } = useCohortMembers(cohort.id);
  const remove = useRemoveCohortMember();
  const [pending, setPending] = useState<CohortMemberRow | null>(null);

  const doRemove = async () => {
    if (!pending) return;
    try {
      await remove.mutateAsync({ cohortId: cohort.id, profileId: pending.profile_id });
      toast.success(`Removed #${pending.position} — seat freed`);
    } catch {
      toast.error('Could not remove member.');
    } finally {
      setPending(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading members…
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-2">
      <p className="px-3 py-2 text-sm text-muted-foreground">
        {members?.length ?? 0} of {cohort.member_cap ?? '∞'} seats filled. Removing
        a member frees the seat — the position can be reclaimed by the next join.
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="w-16" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {(members ?? []).map((m) => (
            <TableRow key={m.profile_id}>
              <TableCell className="font-medium tabular-nums">{m.position}</TableCell>
              <TableCell>{m.name ?? '—'}</TableCell>
              <TableCell className="text-muted-foreground">{m.email ?? '—'}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => setPending(m)}
                  aria-label={`Remove member #${m.position}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {(members ?? []).length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                No members yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {pending?.name ?? `member #${pending?.position}`}?</AlertDialogTitle>
            <AlertDialogDescription>
              This frees their seat (#{pending?.position}) and removes their cohort
              membership and beta eligibility. Their Charter 100 badge stays unless
              you revoke it separately. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={remove.isPending}
              onClick={doRemove}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
