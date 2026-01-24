import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus, Trash2, Mail, Clock, CheckCircle2, Loader2, Copy, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

interface StaffManagementProps {
  businessId: string;
}

export function StaffManagement({ businessId }: StaffManagementProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'staff' | 'manager'>('staff');

  // Fetch current staff
  const { data: staff, isLoading: loadingStaff } = useQuery({
    queryKey: ['business-staff', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_staff')
        .select('*')
        .eq('business_id', businessId);
      
      if (error) throw error;
      
      // Fetch profile names separately
      if (data && data.length > 0) {
        const userIds = data.map(s => s.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name, avatar_url')
          .in('user_id', userIds);
        
        return data.map(staff => ({
          ...staff,
          profile: profiles?.find(p => p.user_id === staff.user_id) || null
        }));
      }
      
      return data;
    },
  });

  // Fetch pending invitations
  const { data: invitations, isLoading: loadingInvites } = useQuery({
    queryKey: ['business-invitations', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_invitations')
        .select('*')
        .eq('business_id', businessId)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Send invitation
  const inviteMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const { data, error } = await supabase
        .from('business_invitations')
        .insert({
          business_id: businessId,
          email,
          role,
          invited_by: user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['business-invitations', businessId] });
      setIsInviteOpen(false);
      setInviteEmail('');
      
      // Show success with link
      const inviteLink = `${window.location.origin}/accept-invitation?token=${data.token}`;
      toast.success('Invitation created! Share the link with your staff member.', {
        action: {
          label: 'Copy Link',
          onClick: () => {
            navigator.clipboard.writeText(inviteLink);
            toast.success('Link copied!');
          },
        },
      });
    },
    onError: () => {
      toast.error('Failed to send invitation. Please try again.');
    },
  });

  // Remove staff
  const removeStaffMutation = useMutation({
    mutationFn: async (staffId: string) => {
      const { error } = await supabase
        .from('business_staff')
        .delete()
        .eq('id', staffId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-staff', businessId] });
      toast.success('Staff member removed');
    },
    onError: () => {
      toast.error('Failed to remove staff member. Please try again.');
    },
  });

  // Cancel invitation
  const cancelInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from('business_invitations')
        .delete()
        .eq('id', inviteId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-invitations', businessId] });
      toast.success('Invitation cancelled');
    },
  });

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/accept-invitation?token=${token}`;
    navigator.clipboard.writeText(link);
    toast.success('Invitation link copied!');
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    inviteMutation.mutate({ email: inviteEmail.trim(), role: inviteRole });
  };

  return (
    <div className="space-y-6">
      {/* Header with Scanner Mode link */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Staff & Scanners</h3>
          <p className="text-sm text-muted-foreground">
            Manage who can scan QR codes for your business
          </p>
        </div>
        <div className="flex gap-2">
          <Link to={`/scanner-mode?business=${businessId}`}>
            <Button variant="outline" size="sm" className="gap-2">
              <QrCode className="h-4 w-4" />
              Open Scanner
            </Button>
          </Link>
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Invite Staff
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Staff Member</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleInvite} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="staff@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as 'staff' | 'manager')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff (Scanner only)</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Staff can only scan QR codes. Managers have additional permissions.
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={inviteMutation.isPending}>
                  {inviteMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Invitation'
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Pending Invitations */}
      {invitations && invitations.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Pending Invitations</h4>
          {invitations.map((invite) => (
            <div
              key={invite.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card"
            >
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{invite.email || invite.phone}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {invite.role} • Expires {formatDistanceToNow(new Date(invite.expires_at), { addSuffix: true })}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyInviteLink(invite.token)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => cancelInviteMutation.mutate(invite.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Current Staff */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">Current Staff</h4>
        
        {loadingStaff ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : staff && staff.length > 0 ? (
          staff.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card"
            >
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {(member as any).profile?.name || 'Staff Member'}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {member.role} • Added {formatDistanceToNow(new Date(member.created_at), { addSuffix: true })}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => removeStaffMutation.mutate(member.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No staff members yet</p>
            <p className="text-sm">Invite staff to help scan customer QR codes</p>
          </div>
        )}
      </div>
    </div>
  );
}
