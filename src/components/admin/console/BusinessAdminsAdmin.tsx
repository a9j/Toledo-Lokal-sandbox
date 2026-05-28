import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Crown, Lock, Store } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';

interface StaffRow {
  business_id: string;
  user_id: string;
  role: string;
  businesses: { name: string; owner_user_id: string | null } | null;
}

const ROLE_STYLES: Record<string, string> = {
  owner: 'bg-lokal-amber/15 text-lokal-amber',
  manager: 'bg-primary/10 text-primary',
  staff: 'bg-secondary text-muted-foreground',
};

const ROLE_LABEL: Record<string, string> = { owner: 'Owner', manager: 'Manager (admin)', staff: 'Staff' };

export function BusinessAdminsAdmin() {
  const { can } = usePermissions();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-business-staff'],
    queryFn: async () => {
      const { data: staff, error } = await supabase
        .from('business_staff')
        .select('business_id, user_id, role, businesses(name, owner_user_id)');
      if (error) throw error;
      const rows = (staff ?? []) as StaffRow[];

      // Names for every staff member + owner involved.
      const userIds = Array.from(new Set([
        ...rows.map((r) => r.user_id),
        ...rows.map((r) => r.businesses?.owner_user_id).filter((x): x is string => !!x),
      ]));
      const names: Record<string, string> = {};
      if (userIds.length) {
        const { data: profiles } = await supabase.from('profiles').select('user_id, name').in('user_id', userIds);
        (profiles ?? []).forEach((p) => { if (p.name) names[p.user_id] = p.name; });
      }
      return { rows, names };
    },
    enabled: can('manage_businesses'),
  });

  if (!can('manage_businesses')) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
        <Lock className="h-4 w-4" /> You don't have access to business management.
      </div>
    );
  }

  // Group rows by business.
  const byBusiness = new Map<string, { name: string; ownerId: string | null; members: { user_id: string; role: string }[] }>();
  for (const r of data?.rows ?? []) {
    if (!byBusiness.has(r.business_id)) {
      byBusiness.set(r.business_id, { name: r.businesses?.name ?? 'Unnamed business', ownerId: r.businesses?.owner_user_id ?? null, members: [] });
    }
    byBusiness.get(r.business_id)!.members.push({ user_id: r.user_id, role: r.role });
  }

  const term = search.trim().toLowerCase();
  const businesses = Array.from(byBusiness.values())
    .filter((b) => !term || b.name.toLowerCase().includes(term))
    .sort((a, b) => a.name.localeCompare(b.name));

  const nameFor = (uid: string) => data?.names[uid] ?? 'Member';

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Businesses that have added managers or staff, and who they are.</p>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search businesses" className="pl-9" />
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      ) : businesses.length === 0 ? (
        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary"><Store className="h-4 w-4 text-muted-foreground" /></div>
          <div>
            <p className="text-sm font-medium">No business admins yet</p>
            <p className="text-xs text-muted-foreground">When owners invite managers or staff, they'll appear here.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {businesses.map((b) => {
            // Show owner first (from businesses.owner_user_id), then staff rows
            // that aren't the owner.
            const ownerInStaff = b.members.some((m) => m.user_id === b.ownerId);
            return (
              <div key={b.name + (b.ownerId ?? '')} className="rounded-2xl border border-border/60 bg-card p-3 shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                    {b.name.charAt(0).toUpperCase()}
                  </div>
                  <p className="truncate text-sm font-semibold">{b.name}</p>
                  <span className="ml-auto text-xs text-muted-foreground">{b.members.length} {b.members.length === 1 ? 'person' : 'people'}</span>
                </div>
                <div className="space-y-1">
                  {b.ownerId && !ownerInStaff && (
                    <div className="flex items-center gap-2 text-sm">
                      <Crown className="h-3.5 w-3.5 text-lokal-amber" />
                      <span className="flex-1 truncate">{nameFor(b.ownerId)}</span>
                      <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', ROLE_STYLES.owner)}>Owner</span>
                    </div>
                  )}
                  {b.members.map((m) => (
                    <div key={m.user_id + m.role} className="flex items-center gap-2 text-sm">
                      <span className="h-3.5 w-3.5" />
                      <span className="flex-1 truncate">{nameFor(m.user_id)}</span>
                      <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', ROLE_STYLES[m.role] ?? ROLE_STYLES.staff)}>
                        {ROLE_LABEL[m.role] ?? m.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
