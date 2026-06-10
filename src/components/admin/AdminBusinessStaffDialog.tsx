import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Copy, Mail, Shield, Trash2, UserPlus, Crown, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { SecureAvatar } from '@/components/ui/secure-avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  useAdminBusinessStaff,
  useAdminBusinessInvitations,
  useAdminAttachStaff,
  useAdminRemoveStaff,
  useAdminChangeRole,
  useAdminCancelInvitation,
  type BusinessStaffRole,
} from '@/hooks/useAdminBusinessStaff';

interface AdminBusinessStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string | null;
  businessName: string | null;
}

const ALL_ROLES: { value: BusinessStaffRole; label: string; desc: string }[] = [
  { value: 'owner', label: 'Owner', desc: 'Full control' },
  { value: 'admin', label: 'Admin', desc: 'All except transfer' },
  { value: 'manager', label: 'Manager', desc: 'Edit profile & content' },
  { value: 'hiring', label: 'Hiring', desc: 'Manage jobs' },
  { value: 'viewer', label: 'Viewer', desc: 'Read-only' },
  { value: 'staff', label: 'Staff', desc: 'Scanner only' },
];

const ROLE_LABELS: Record<string, string> = Object.fromEntries(ALL_ROLES.map(r => [r.value, r.label]));

const ROLE_STYLES: Record<string, string> = {
  owner: 'bg-amber-100 text-amber-700',
  admin: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  hiring: 'bg-emerald-100 text-emerald-700',
  viewer: 'bg-secondary text-muted-foreground',
  staff: 'bg-secondary text-muted-foreground',
};

function invitationLink(token: string) {
  return `${window.location.origin}/accept-invitation?token=${token}`;
}

export function AdminBusinessStaffDialog({ open, onOpenChange, businessId, businessName }: AdminBusinessStaffDialogProps) {
  const { data: staff, isLoading: staffLoading } = useAdminBusinessStaff(businessId);
  const { data: invitations, isLoading: invLoading } = useAdminBusinessInvitations(businessId);
  const attach = useAdminAttachStaff();
  const remove = useAdminRemoveStaff();
  const changeRole = useAdminChangeRole();
  const cancel = useAdminCancelInvitation();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<BusinessStaffRole>('manager');
  const [note, setNote] = useState('');

  const hasOwner = staff?.some(s => s.role === 'owner');

  const submit = async () => {
    if (!businessId || !email.trim()) return;
    const isOwnerAssign = role === 'owner' && hasOwner;
    try {
      const result = await attach.mutateAsync({
        businessId,
        role,
        email: email.trim(),
        note: note.trim() || undefined,
        force: isOwnerAssign,
      });
      if (result.action === 'noop') {
        toast.info(result.message || 'No changes made');
      } else if (result.action === 'attach') {
        toast.success('Added to business', { description: `${email.trim()} assigned as ${ROLE_LABELS[role]}.` });
      } else {
        toast.success('Invitation created', {
          description: `No account for ${email.trim()} — invitation link created.`,
        });
      }
      setEmail('');
      setNote('');
    } catch (err) {
      toast.error('Could not assign role', { description: err instanceof Error ? err.message : 'Check your admin permissions.' });
    }
  };

  const doChangeRole = async (staffId: string, newRole: BusinessStaffRole, label: string, bId: string) => {
    const isOwnerPromotion = newRole === 'owner' && hasOwner;
    try {
      const result = await changeRole.mutateAsync({
        staffId,
        businessId: bId,
        newRole,
        force: isOwnerPromotion,
      });
      if (result.action === 'noop') {
        toast.info(result.message || 'No changes made');
      } else {
        toast.success(`${label} role changed to ${ROLE_LABELS[newRole]}`);
      }
    } catch (err) {
      toast.error('Could not change role', { description: err instanceof Error ? err.message : undefined });
    }
  };

  const doRemove = async (staffId: string, label: string) => {
    if (!businessId) return;
    try {
      await remove.mutateAsync({ staffId, businessId });
      toast.success(`${label} removed`);
    } catch (err) {
      toast.error('Could not remove', { description: err instanceof Error ? err.message : undefined });
    }
  };

  const doCancel = async (invitationId: string, label: string) => {
    if (!businessId) return;
    try {
      await cancel.mutateAsync({ invitationId, businessId });
      toast.success(`Invitation to ${label} cancelled`);
    } catch (err) {
      toast.error('Could not cancel invitation', { description: err instanceof Error ? err.message : undefined });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-background border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Members
            {businessName && <span className="font-normal text-muted-foreground">· {businessName}</span>}
          </DialogTitle>
          <DialogDescription>
            Admin override. Assign any role directly — admin authority is the verification. Every action is logged.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Owner seat status */}
          {!staffLoading && !hasOwner && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-300/60 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700/40 dark:bg-amber-950/30 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span><strong>Owner: unclaimed.</strong> This business has no owner assigned.</span>
            </div>
          )}

          {/* Assign member */}
          <section className="space-y-3 rounded-2xl border border-border/60 bg-secondary/30 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <UserPlus className="h-4 w-4" /> Assign member
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_160px]">
              <div>
                <Label className="mb-1 block text-xs">Email</Label>
                <Input
                  type="email"
                  placeholder="person@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as BusinessStaffRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {ALL_ROLES.map(r => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label} <span className="text-muted-foreground ml-1">— {r.desc}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="mb-1 block text-xs">Note (optional)</Label>
              <Input
                placeholder="Reason for the admin override (audit log)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={200}
              />
            </div>
            {role === 'owner' && hasOwner && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                An owner already exists and will be demoted to Manager.
              </p>
            )}
            <Button
              className="w-full sm:w-auto"
              disabled={!email.trim() || !businessId || attach.isPending}
              onClick={submit}
            >
              {attach.isPending ? 'Assigning…' : 'Assign to business'}
            </Button>
            <p className="text-[11px] text-muted-foreground">
              If the email has an account, they're added directly. Otherwise, an invitation link is created.
            </p>
          </section>

          {/* Current members */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current members</h3>
            {staffLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-xl" />
                ))}
              </div>
            ) : !staff || staff.length === 0 ? (
              <p className="text-sm text-muted-foreground">No one is assigned to this business yet.</p>
            ) : (
              <div className="space-y-2">
                {staff.map((row) => {
                  const label = row.profile?.name || 'Resident';
                  return (
                    <div key={row.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3">
                      <SecureAvatar
                        storagePath={row.profile?.avatar_url}
                        fallbackText={label}
                        className="h-9 w-9"
                        fallbackClassName="bg-secondary text-foreground text-sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{label}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          since {new Date(row.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Select
                        value={row.role}
                        onValueChange={(v) => doChangeRole(row.id, v as BusinessStaffRole, label, row.business_id)}
                        disabled={changeRole.isPending}
                      >
                        <SelectTrigger
                          className={cn(
                            'h-7 w-auto min-w-[100px] gap-1 rounded-full border-0 px-2.5 text-[11px] font-medium',
                            ROLE_STYLES[row.role] ?? 'bg-secondary'
                          )}
                        >
                          {row.role === 'owner' && <Crown className="h-3 w-3" />}
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          {ALL_ROLES.map(r => (
                            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {row.role !== 'owner' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          disabled={remove.isPending}
                          onClick={() => doRemove(row.id, label)}
                          title="Remove from business"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Pending invitations */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pending invitations</h3>
            {invLoading ? (
              <Skeleton className="h-14 rounded-xl" />
            ) : !invitations || invitations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending invitations.</p>
            ) : (
              <div className="space-y-2">
                {invitations.map((inv) => {
                  const target = inv.email || inv.phone || 'unknown';
                  const expired = new Date(inv.expires_at) < new Date();
                  return (
                    <div key={inv.id} className="rounded-xl border border-border/60 bg-card p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{target}</p>
                          <p className="text-xs text-muted-foreground">
                            {ROLE_LABELS[inv.role] ?? inv.role} ·{' '}
                            {expired
                              ? 'Expired'
                              : `Expires ${formatDistanceToNow(new Date(inv.expires_at), { addSuffix: true })}`}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 text-xs"
                          onClick={() => {
                            navigator.clipboard?.writeText(invitationLink(inv.token));
                            toast.success('Invitation link copied');
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" /> Link
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          disabled={cancel.isPending}
                          onClick={() => doCancel(inv.id, target)}
                          title="Cancel invitation"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
