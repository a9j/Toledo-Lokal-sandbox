import { useState } from 'react';
import { Loader2, Plus, Ticket, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { JoinQRCode } from '@/components/join/JoinQRCode';
import { siteUrl } from '@/lib/site-url';
import { useAuth } from '@/contexts/AuthContext';
import {
  useCohortInvites, useGenerateInvites, useRevokeInvite, inviteState,
  type CohortInviteRow, type InviteState,
} from '@/hooks/useCohortAdmin';
import type { AdminCohort } from '@/hooks/useCohortAdmin';

const STATE_STYLES: Record<InviteState, string> = {
  unused: 'bg-emerald-500/15 text-emerald-600',
  used: 'bg-muted text-muted-foreground',
  expired: 'bg-amber-500/15 text-amber-600',
  revoked: 'bg-destructive/15 text-destructive',
};

// Invite generation + lifecycle for a cohort. Generation inserts under
// RLS (manager/admin); revoke goes through the logged admin_revoke_invite RPC.
export function CohortInvites({ cohort }: { cohort: AdminCohort }) {
  const { user } = useAuth();
  const { data: invites, isLoading } = useCohortInvites(cohort.id);
  const generate = useGenerateInvites();
  const revoke = useRevokeInvite();

  const [mode, setMode] = useState<'batch' | 'rotating'>('batch');
  const [batchCount, setBatchCount] = useState(10);
  const [rotatingUses, setRotatingUses] = useState(50);
  const [fresh, setFresh] = useState<string[]>([]);
  const [pendingRevoke, setPendingRevoke] = useState<CohortInviteRow | null>(null);

  const joinUrl = (token: string) =>
    siteUrl(`/join/${cohort.slug}?token=${encodeURIComponent(token)}`);

  const handleGenerate = async () => {
    try {
      const created = await generate.mutateAsync({
        cohortId: cohort.id,
        createdBy: user?.id ?? null,
        mode,
        count: batchCount,
        uses: rotatingUses,
      });
      setFresh(created.map((c) => c.token));
      toast.success(
        mode === 'batch'
          ? `${created.length} single-use ${created.length === 1 ? 'token' : 'tokens'} created`
          : `Rotating token created (${Math.max(rotatingUses, 1)} uses)`,
      );
    } catch {
      toast.error('Could not generate invites. Check your permissions.');
    }
  };

  const doRevoke = async () => {
    if (!pendingRevoke) return;
    try {
      await revoke.mutateAsync({ inviteId: pendingRevoke.id, cohortId: cohort.id });
      toast.success('Invite revoked');
    } catch {
      toast.error('Could not revoke invite.');
    } finally {
      setPendingRevoke(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Generate */}
      <div className="rounded-2xl border border-border/60 bg-card p-5">
        <div className="mb-4 flex gap-2">
          <Button variant={mode === 'batch' ? 'default' : 'outline'} size="sm" onClick={() => setMode('batch')}>
            <Ticket className="mr-1 h-4 w-4" /> Single-use batch
          </Button>
          <Button variant={mode === 'rotating' ? 'default' : 'outline'} size="sm" onClick={() => setMode('rotating')}>
            <Ticket className="mr-1 h-4 w-4" /> Rotating / event
          </Button>
        </div>
        {mode === 'batch' ? (
          <div className="space-y-2">
            <Label htmlFor="batch-count">How many single-use tokens?</Label>
            <Input id="batch-count" type="number" min={1} max={100} value={batchCount}
              onChange={(e) => setBatchCount(Number(e.target.value))} className="max-w-[140px]" />
            <p className="text-xs text-muted-foreground">One person each — up to 100 at a time.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="rotating-uses">Total uses for this token</Label>
            <Input id="rotating-uses" type="number" min={1} value={rotatingUses}
              onChange={(e) => setRotatingUses(Number(e.target.value))} className="max-w-[140px]" />
            <p className="text-xs text-muted-foreground">One code for a poster or table card.</p>
          </div>
        )}
        <Button className="mt-4" onClick={handleGenerate} disabled={generate.isPending}>
          {generate.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
          Generate
        </Button>
      </div>

      {/* Freshly generated QR codes */}
      {fresh.length > 0 && (
        <div>
          <p className="mb-3 text-sm text-muted-foreground">
            {fresh.length === 1 ? 'Your rotating token. Download or print it.' : `${fresh.length} single-use codes.`}
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {fresh.map((token) => (
              <div key={token} className="flex flex-col items-center rounded-2xl border border-border/60 bg-card p-4 text-center">
                <JoinQRCode url={joinUrl(token)} size={fresh.length === 1 ? 280 : 160} />
                <code className="mt-3 break-all text-[10px] text-muted-foreground">{token}</code>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing invites */}
      <div className="rounded-2xl border border-border/60 bg-card p-2">
        {isLoading ? (
          <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading invites…
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Token</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Uses left</TableHead>
                <TableHead>State</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(invites ?? []).map((inv) => {
                const state = inviteState(inv);
                const canRevoke = state === 'unused';
                return (
                  <TableRow key={inv.id}>
                    <TableCell><code className="text-[11px]">{inv.token}</code></TableCell>
                    <TableCell className="text-muted-foreground">
                      {inv.single_use ? 'Single-use' : 'Rotating'}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {inv.uses_remaining ?? '∞'}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATE_STYLES[state]} variant="secondary">{state}</Badge>
                    </TableCell>
                    <TableCell>
                      {canRevoke && (
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10"
                          onClick={() => setPendingRevoke(inv)} aria-label="Revoke invite">
                          <Ban className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {(invites ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                    No invites yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <AlertDialog open={!!pendingRevoke} onOpenChange={(o) => !o && setPendingRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke this invite?</AlertDialogTitle>
            <AlertDialogDescription>
              The token stops working immediately. Anyone who already joined keeps
              their seat. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={revoke.isPending}
              onClick={doRevoke}
            >
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
