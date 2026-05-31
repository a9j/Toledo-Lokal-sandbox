import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Copy, Mail, Shield, Trash2, UserPlus, Crown } from 'lucide-react';
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
  useAdminCancelInvitation,
} from '@/hooks/useAdminBusinessStaff';

interface AdminBusinessStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string | null;
  businessName: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  manager: 'Manager',
  staff: 'Staff',
};

const ROLE_STYLES: Record<string, string> = {
  owner: 'bg-amber-100 text-amber-700',
  manager: 'bg-blue-100 text-blue-700',
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
  const cancel = useAdminCancelInvitation();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'staff' | 'manager'>('staff');
  const [note, setNote] = useState('');

  const submit = async () => {
    if (!businessId || !email.trim()) return;
    try {
      const result = await attach.mutateAsync({
        businessId,
        role,
        email: email.trim(),
        note: note.trim() || undefined,
      });
      if (result.action === 'attach') {
        toast.success('Added to business staff', { description: `${email.trim()} now has access as ${ROLE_LABELS[role]}.` });
      } else {
        toast.success('Invitation sent', {
          description: `No account found for ${email.trim()} — created an invitation link they can accept.`,
        });
      }
      setEmail('');
      setNote('');
    } catch (err) {
      toast.error('Could not attach staff', { description: err instanceof Error ? err.message : 'Check your admin permissions.' });
    }
  };

  const doRemove = async (staffId: string, label: string) => {
    if (!businessId) return;
    try {
      await remove.mutateAsync({ staffId, businessId });
      toast.success(`${label} removed from staff`);
    } catch (err) {
      toast.error('Could not remove staff', { description: err instanceof Error ? err.message : undefined });
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
            Manage staff
            {businessName && <span className="font-normal text-muted-foreground">· {businessName}</span>}
          </DialogTitle>
          <DialogDescription>
            Admin override. Use this when the business can't add a teammate themselves. Every action is logged.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add */}
          <section className="space-y-3 rounded-2xl border border-border/60 bg-secondary/30 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <UserPlus className="h-4 w-4" /> Attach a person
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_140px]">
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
                <Select value={role} onValueChange={(v) => setRole(v as 'staff' | 'manager')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="staff">Staff (scanner)</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
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
            <Button
              className="w-full sm:w-auto"
              disabled={!email.trim() || !businessId || attach.isPending}
              onClick={submit}
            >
              {attach.isPending ? 'Attaching…' : 'Attach to business'}
            </Button>
            <p className="text-[11px] text-muted-foreground">
              If the email already has an account, the person is added directly. Otherwise, an invitation link is created.
            </p>
          </section>

          {/* Current staff */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current staff</h3>
            {staffLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-xl" />
                ))}
              </div>
            ) : !staff || staff.length === 0 ? (
              <p className="text-sm text-muted-foreground">No one is attached to this business yet.</p>
            ) : (
              <div className="space-y-2">
                {staff.map((row) => {
                  const label = row.profile?.name || 'Resident';
                  const initial = label.charAt(0).toUpperCase();
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
                        <p className="truncate text-xs text-muted-foreground">{ROLE_LABELS[row.role] ?? row.role} · since {new Date(row.created_at).toLocaleDateString()}</p>
                      </div>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                          ROLE_STYLES[row.role] ?? 'bg-secondary'
                        )}
                      >
                        {row.role === 'owner' && <Crown className="h-3 w-3" />}
                        {ROLE_LABELS[row.role] ?? row.role}
                      </span>
                      {row.role !== 'owner' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          disabled={remove.isPending}
                          onClick={() => doRemove(row.id, label)}
                          title="Remove from staff"
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
                            {ROLE_LABELS[inv.role]} ·{' '}
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
