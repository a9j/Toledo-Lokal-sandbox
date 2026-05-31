import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  Loader2,
  Shield,
  Users,
  CalendarDays,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeamManagerProps {
  businessId: string;
}

interface StaffRow {
  id: string;
  user_id: string;
  business_id: string;
  role: string;
  created_at: string;
  profile?: { display_name: string | null; avatar_url: string | null; email?: string | null } | null;
}

const ROLE_OPTIONS = [
  { value: 'manager', label: 'Manager' },
  { value: 'scanner', label: 'Scanner' },
  { value: 'viewer', label: 'Viewer' },
];

const ROLE_LABELS: Record<string, { label: string; className: string }> = {
  owner: { label: 'Owner', className: 'bg-primary/10 text-primary' },
  manager: { label: 'Manager', className: 'bg-emerald-100 text-emerald-800' },
  scanner: { label: 'Scanner', className: 'bg-blue-100 text-blue-800' },
  viewer: { label: 'Viewer', className: 'bg-slate-100 text-slate-700' },
};

function useTeamMembers(businessId: string) {
  return useQuery({
    queryKey: ['admin-team', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_staff')
        .select('id, user_id, business_id, role, created_at')
        .eq('business_id', businessId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      if (!data || data.length === 0) return [];

      const userIds = data.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.id, p])
      );

      return data.map((row) => ({
        ...row,
        profile: profileMap.get(row.user_id) || null,
      })) as StaffRow[];
    },
    enabled: !!businessId,
  });
}

export function TeamManager({ businessId }: TeamManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: members, isLoading } = useTeamMembers(businessId);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('scanner');

  const addMutation = useMutation({
    mutationFn: async () => {
      const email = inviteEmail.trim().toLowerCase();
      if (!email) throw new Error('Email required');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) throw new Error('No account found with that email. They need to sign up first.');

      const { error } = await supabase.from('business_staff').insert({
        business_id: businessId,
        user_id: profile.id,
        role: inviteRole,
      });
      if (error) {
        if (error.code === '23505') throw new Error('This person is already on your team.');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-team', businessId] });
      toast({ title: 'Team member added' });
      setInviteOpen(false);
      setInviteEmail('');
      setInviteRole('scanner');
    },
    onError: (e: Error) => {
      toast({ variant: 'destructive', title: 'Could not add member', description: e.message });
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const { error } = await supabase
        .from('business_staff')
        .update({ role })
        .eq('id', id)
        .eq('business_id', businessId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-team', businessId] });
      toast({ title: 'Role updated' });
    },
    onError: (e: Error) => {
      toast({ variant: 'destructive', title: 'Could not update', description: e.message });
    },
  });

  const removeMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('business_staff')
        .delete()
        .eq('id', id)
        .eq('business_id', businessId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-team', businessId] });
      toast({ title: 'Team member removed' });
    },
    onError: (e: Error) => {
      toast({ variant: 'destructive', title: 'Could not remove', description: e.message });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold tracking-tight">Team</h2>
          <p className="text-sm text-muted-foreground">
            Manage who has access to your business admin panel.
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Member
        </Button>
      </div>

      {/* Role descriptions */}
      <div className="card-elevated p-4 space-y-2">
        <h3 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">Roles</h3>
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg bg-secondary/50 p-3">
            <p className="text-xs font-semibold">Manager</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Full access to all sections except billing and team management</p>
          </div>
          <div className="rounded-lg bg-secondary/50 p-3">
            <p className="text-xs font-semibold">Scanner</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Can scan QR codes and confirm check-ins for Loop and Passport</p>
          </div>
          <div className="rounded-lg bg-secondary/50 p-3">
            <p className="text-xs font-semibold">Viewer</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Read-only access to dashboard and analytics</p>
          </div>
        </div>
      </div>

      {/* Team list */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Team members</h3>
        {!members?.length ? (
          <div className="card-elevated p-6 text-center">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No team members yet. Add people to help manage your business.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((member) => {
              const roleInfo = ROLE_LABELS[member.role] || ROLE_LABELS.viewer;
              const isSelf = member.user_id === user?.id;

              return (
                <div key={member.id} className="card-elevated p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    {member.profile?.avatar_url ? (
                      <img
                        src={member.profile.avatar_url}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <Shield className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">
                        {member.profile?.display_name || 'Team member'}
                      </p>
                      <Badge variant="outline" className={cn('text-[10px]', roleInfo.className)}>
                        {roleInfo.label}
                      </Badge>
                      {isSelf && (
                        <span className="text-[10px] text-muted-foreground">(you)</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      Added {new Date(member.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  {!isSelf && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Select
                        value={member.role}
                        onValueChange={(v) => updateRole.mutate({ id: member.id, role: v })}
                      >
                        <SelectTrigger className="h-8 w-[110px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map((r) => (
                            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => removeMember.mutate(member.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={(open) => { if (!open) setInviteOpen(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="team@example.com"
              />
              <p className="text-xs text-muted-foreground mt-1">
                They must have a Toledo Lokal account
              </p>
            </div>
            <div>
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
              <Button
                onClick={() => addMutation.mutate()}
                disabled={!inviteEmail.trim() || addMutation.isPending}
              >
                {addMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Adding...</>
                ) : 'Add to Team'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
