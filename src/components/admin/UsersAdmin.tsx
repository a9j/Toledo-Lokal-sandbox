import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Search, UserPlus, Crown, Shield, Building2, Heart, Users, Calendar, ShieldOff, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface BusinessAffiliation {
  user_id: string;
  role: 'owner' | 'manager' | 'staff';
  business_id: string;
  business_name: string;
}

const AFFILIATION_LABEL: Record<BusinessAffiliation['role'], string> = {
  owner: 'Owner of',
  manager: 'Manager at',
  staff: 'Staff at',
};

const AFFILIATION_STYLE: Record<BusinessAffiliation['role'], string> = {
  owner: 'bg-amber-50 text-amber-700 border-amber-200',
  manager: 'bg-primary/10 text-primary border-primary/20',
  staff: 'bg-secondary text-muted-foreground border-border',
};

interface AdminProfile {
  avatar_url: string | null;
  created_at: string;
  favorite_categories: string[] | null;
  id: string;
  name: string | null;
  neighborhood_id: string | null;
  profile_completed: boolean;
  role_selected: boolean;
  updated_at: string;
  user_id: string;
  vibe: string[];
}

export function UsersAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [revokeTarget, setRevokeTarget] = useState<AdminProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminProfile | null>(null);
  const [confirmText, setConfirmText] = useState('');

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['admin-all-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_get_all_profiles');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: allRoles } = useQuery({
    queryKey: ['admin-all-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: connectors } = useQuery({
    queryKey: ['admin-connectors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('connectors')
        .select('user_id, is_founding, referral_code');
      if (error) throw error;
      return data || [];
    },
  });

  // Who controls which business. Combines explicit staff/manager rows with
  // owner_user_id on businesses so the picture is complete. Admins can see
  // all of this via the admin-override RLS on business_staff.
  const { data: businessAffiliations } = useQuery<BusinessAffiliation[]>({
    queryKey: ['admin-user-business-affiliations'],
    queryFn: async () => {
      const [staffRes, ownerRes] = await Promise.all([
        supabase
          .from('business_staff')
          .select('user_id, role, business:businesses(id, name)'),
        supabase
          .from('businesses')
          .select('id, name, owner_user_id'),
      ]);
      if (staffRes.error) throw staffRes.error;
      if (ownerRes.error) throw ownerRes.error;

      const out: BusinessAffiliation[] = [];
      const seen = new Set<string>(); // user_id|business_id de-dupe

      for (const row of (staffRes.data ?? []) as Array<{
        user_id: string;
        role: 'owner' | 'manager' | 'staff';
        business: { id: string; name: string } | null;
      }>) {
        if (!row.business?.id) continue;
        const key = `${row.user_id}|${row.business.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          user_id: row.user_id,
          role: row.role,
          business_id: row.business.id,
          business_name: row.business.name,
        });
      }
      for (const biz of (ownerRes.data ?? []) as Array<{ id: string; name: string; owner_user_id: string | null }>) {
        if (!biz.owner_user_id) continue;
        const key = `${biz.owner_user_id}|${biz.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ user_id: biz.owner_user_id, role: 'owner', business_id: biz.id, business_name: biz.name });
      }
      return out;
    },
  });

  const makeConnector = useMutation({
    mutationFn: async (userId: string) => {
      // Create connector record
      const { error: connError } = await supabase
        .from('connectors')
        .insert({ user_id: userId, is_founding: true });
      if (connError) throw connError;

      // Add connector role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'connector' });
      if (roleError && !roleError.message.includes('duplicate')) throw roleError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-roles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-connectors'] });
      toast({ title: 'Founding Connector assigned!' });
    },
    onError: (err: Error) => {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    },
  });

  const removeConnector = useMutation({
    mutationFn: async (userId: string) => {
      const { error: connError } = await supabase
        .from('connectors')
        .delete()
        .eq('user_id', userId);
      if (connError) throw connError;

      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'connector');
      if (roleError) throw roleError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-roles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-connectors'] });
      toast({ title: 'Connector status removed' });
    },
  });

  // Soft removal: strip every elevated role and any connector record, leaving
  // the baseline 'resident' role. The login and profile stay intact.
  const revokeAccess = useMutation({
    mutationFn: async (userId: string) => {
      await supabase.from('connectors').delete().eq('user_id', userId);
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .neq('role', 'resident');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-roles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-connectors'] });
      toast({ title: 'Access revoked', description: 'User reset to a basic resident account.' });
      setRevokeTarget(null);
    },
    onError: (err: Error) => toast({ variant: 'destructive', title: 'Error', description: err.message }),
  });

  // Hard removal: permanently delete the auth account (cascades to profile,
  // roles, and owned businesses) via the admin-delete-user edge function.
  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('admin-delete-user', { body: { userId } });
      if (error) throw error;
      const result = data as { error?: string } | null;
      if (result?.error) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-roles'] });
      queryClient.invalidateQueries({ queryKey: ['admin-connectors'] });
      toast({ title: 'Account deleted' });
      setDeleteTarget(null);
      setConfirmText('');
    },
    onError: (err: Error) => toast({ variant: 'destructive', title: 'Could not delete', description: err.message }),
  });

  const getRolesForUser = (userId: string) => {
    return allRoles?.filter(r => r.user_id === userId).map(r => r.role) || [];
  };

  const isConnectorUser = (userId: string) => {
    return connectors?.some(c => c.user_id === userId) || false;
  };

  const getConnectorCode = (userId: string) => {
    return connectors?.find(c => c.user_id === userId)?.referral_code;
  };

  const getAffiliationsForUser = (userId: string): BusinessAffiliation[] => {
    const list = (businessAffiliations ?? []).filter((a) => a.user_id === userId);
    // Show owner first, then manager, then staff.
    const rank: Record<BusinessAffiliation['role'], number> = { owner: 0, manager: 1, staff: 2 };
    return [...list].sort((a, b) => rank[a.role] - rank[b.role] || a.business_name.localeCompare(b.business_name));
  };

  const roleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-3 w-3" />;
      case 'business': return <Building2 className="h-3 w-3" />;
      case 'connector': return <Crown className="h-3 w-3" />;
      case 'nonprofit': return <Heart className="h-3 w-3" />;
      default: return <Users className="h-3 w-3" />;
    }
  };

  const roleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'business': return 'bg-primary/10 text-primary border-primary/20';
      case 'connector': return 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0';
      case 'nonprofit': return 'bg-green-100 text-green-700 border-green-200';
      default: return '';
    }
  };

  const filtered = profiles?.filter(p => {
    if (!search) return true;
    const term = search.toLowerCase();
    const profileMatch =
      (p as AdminProfile).name?.toLowerCase().includes(term) ||
      (p as AdminProfile).user_id?.toLowerCase().includes(term);
    if (profileMatch) return true;
    // Match by business affiliation too — typing a business name surfaces
    // everyone attached to it.
    const affiliations = getAffiliationsForUser((p as AdminProfile).user_id);
    return affiliations.some((a) => a.business_name.toLowerCase().includes(term));
  }) || [];

  const sortedProfiles = [...filtered].sort((a, b) => {
    const aDate = new Date((a as AdminProfile).created_at || 0).getTime();
    const bDate = new Date((b as AdminProfile).created_at || 0).getTime();
    return bDate - aDate;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {profiles?.length || 0} registered users
        </p>
        <Badge variant="outline" className="gap-1 bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
          <Crown className="h-3 w-3 text-amber-600" />
          <span className="text-amber-700">
            {connectors?.length || 0} Connectors
          </span>
        </Badge>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-8">Loading users...</p>
      ) : (
        <div className="space-y-2">
          {sortedProfiles.map((profile) => {
            const roles = getRolesForUser(profile.user_id);
            const isConn = isConnectorUser(profile.user_id);
            const code = getConnectorCode(profile.user_id);
            const isSelf = profile.user_id === currentUser?.id;
            const isTargetAdmin = roles.includes('admin');
            const canModerate = !isSelf && !isTargetAdmin;
            const hasElevatedRoles = roles.some((r: string) => r !== 'resident');

            return (
              <div
                key={profile.id}
                className={`card-elevated p-3 ${isConn ? 'ring-1 ring-amber-400/40' : ''}`}
              >
                <div className="space-y-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium break-words">{profile.name || 'Unnamed'}</span>
                      {roles.filter(r => r !== 'resident').map(role => (
                        <Badge
                          key={role}
                          variant="outline"
                          className={`text-[10px] gap-1 shrink-0 ${roleColor(role)}`}
                        >
                          {roleIcon(role)}
                          {role}
                        </Badge>
                      ))}
                    </div>
                    {(() => {
                      const affiliations = getAffiliationsForUser(profile.user_id);
                      if (affiliations.length === 0) return null;
                      return (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {affiliations.map((a) => (
                            <Link
                              key={`${a.business_id}-${a.role}`}
                              to={`/business/${a.business_id}`}
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium hover:underline max-w-full ${AFFILIATION_STYLE[a.role]}`}
                              title={`${AFFILIATION_LABEL[a.role]} ${a.business_name}`}
                            >
                              <Building2 className="h-2.5 w-2.5 shrink-0" />
                              <span className="truncate">{AFFILIATION_LABEL[a.role]} {a.business_name}</span>
                            </Link>
                          ))}
                        </div>
                      );
                    })()}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3 shrink-0" />
                      {format(new Date(profile.created_at), 'MMM d, yyyy')}
                      {code && (
                        <span className="text-amber-600 font-mono">{code}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-wrap">
                    {isConn ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-muted-foreground"
                        onClick={() => removeConnector.mutate(profile.user_id)}
                        disabled={removeConnector.isPending}
                      >
                        Remove
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                        onClick={() => makeConnector.mutate(profile.user_id)}
                        disabled={makeConnector.isPending}
                      >
                        <Crown className="h-3 w-3" />
                        Make Connector
                      </Button>
                    )}

                    {canModerate && hasElevatedRoles && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1 text-xs text-muted-foreground"
                        onClick={() => setRevokeTarget(profile)}
                        title="Revoke elevated roles"
                      >
                        <ShieldOff className="h-3.5 w-3.5" /> Revoke
                      </Button>
                    )}

                    {canModerate && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => { setDeleteTarget(profile); setConfirmText(''); }}
                        title="Delete account permanently"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Revoke access (soft) */}
      <Dialog open={!!revokeTarget} onOpenChange={(o) => !o && setRevokeTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke access?</DialogTitle>
            <DialogDescription>
              {revokeTarget?.name || 'This user'} will lose all elevated roles (business,
              connector, nonprofit, etc.) and be reset to a basic resident account. Their login
              and profile stay intact, and you can re-grant roles later.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setRevokeTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={revokeAccess.isPending}
              onClick={() => revokeTarget && revokeAccess.mutate(revokeTarget.user_id)}
            >
              {revokeAccess.isPending ? 'Revoking…' : 'Revoke access'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete account (hard, typed confirmation) */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) { setDeleteTarget(null); setConfirmText(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete account permanently?</DialogTitle>
            <DialogDescription>
              This permanently deletes {deleteTarget?.name || 'this user'}'s account, profile,
              roles, and any businesses they own. This cannot be undone. Type{' '}
              <span className="font-semibold text-foreground">DELETE</span> to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type DELETE"
            className="mt-2"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { setDeleteTarget(null); setConfirmText(''); }}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={confirmText !== 'DELETE' || deleteUser.isPending}
              onClick={() => deleteTarget && deleteUser.mutate(deleteTarget.user_id)}
            >
              {deleteUser.isPending ? 'Deleting…' : 'Delete permanently'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
