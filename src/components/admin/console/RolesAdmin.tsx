import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Check, BadgeCheck, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import {
  AppRole, MANAGEABLE_ROLES, ROLE_LABELS, ROLE_CAPABILITIES, CAPABILITY_LABELS, Capability,
} from '@/lib/permissions';

export function RolesAdmin() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const canManage = can('manage_roles');
  const [search, setSearch] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-roles-users', search],
    queryFn: async () => {
      let q = supabase.from('profiles').select('user_id, name, avatar_url').limit(30);
      if (search.trim().length >= 2) {
        q = q.ilike('name', `%${search.trim()}%`);
      } else {
        q = q.order('created_at', { ascending: false });
      }
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const { data: allRoles } = useQuery({
    queryKey: ['admin-roles-all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_roles').select('user_id, role');
      if (error) throw error;
      return data;
    },
  });

  const rolesFor = (userId: string): AppRole[] =>
    (allRoles ?? []).filter((r) => r.user_id === userId).map((r) => r.role as AppRole);

  const toggleRole = useMutation({
    mutationFn: async ({ userId, role, has }: { userId: string; role: AppRole; has: boolean }) => {
      if (has) {
        const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', role);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_roles').insert({ user_id: userId, role });
        if (error && !error.message.includes('duplicate')) throw error;
      }
    },
    onSuccess: (_d, v) => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles-all'] });
      toast.success(v.has ? `Removed ${ROLE_LABELS[v.role] ?? v.role}` : `Granted ${ROLE_LABELS[v.role] ?? v.role}`);
    },
    onError: () => toast.error('Could not update role. Check your permissions.'),
  });

  return (
    <div className="space-y-6">
      {!canManage && (
        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-secondary/50 px-3 py-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" /> You can view roles but not change them.
        </div>
      )}

      {/* User role assignment */}
      <div>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search people by name or email" className="pl-9" />
        </div>

        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
        ) : !users || users.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No people found.</p>
        ) : (
          <div className="space-y-2">
            {users.map((u) => {
              const userRoles = rolesFor(u.user_id);
              return (
                <div key={u.user_id} className="rounded-2xl border border-border/60 bg-card p-3 shadow-sm">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {(u.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{u.name || 'Unnamed resident'}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {userRoles.length ? userRoles.map((r) => ROLE_LABELS[r] ?? r).join(' · ') : 'Resident'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {MANAGEABLE_ROLES.map((role) => {
                      const has = userRoles.includes(role);
                      return (
                        <button
                          key={role}
                          disabled={!canManage || toggleRole.isPending}
                          onClick={() => toggleRole.mutate({ userId: u.user_id, role, has })}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                            has ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-secondary',
                            (!canManage || toggleRole.isPending) && 'cursor-not-allowed opacity-60'
                          )}
                        >
                          {has && <Check className="h-3 w-3" />}
                          {ROLE_LABELS[role] ?? role}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Permission matrix reference */}
      <div>
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><BadgeCheck className="h-4 w-4 text-primary" /> Role permissions</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {MANAGEABLE_ROLES.map((role) => {
            const caps = ROLE_CAPABILITIES[role] ?? [];
            return (
              <div key={role} className="rounded-2xl border border-border/60 bg-card p-3 shadow-sm">
                <p className="mb-1.5 text-sm font-semibold">{ROLE_LABELS[role] ?? role}</p>
                <div className="flex flex-wrap gap-1">
                  {caps.length === 0 ? (
                    <span className="text-xs text-muted-foreground">No console capabilities</span>
                  ) : caps.length === Object.keys(CAPABILITY_LABELS).length ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Full access</span>
                  ) : (
                    caps.map((c: Capability) => (
                      <span key={c} className="rounded-full bg-secondary px-2 py-0.5 text-xs text-foreground/80">{CAPABILITY_LABELS[c]}</span>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Trust badges (verified local, trusted reviewer, contributor) build on this and arrive in a later phase.
        </p>
      </div>
    </div>
  );
}
