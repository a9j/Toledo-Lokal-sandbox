import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { TierBadge } from '@/components/business/TierBadge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Building2,
  Shield,
  ArrowLeft,
  Search,
  Crown,
  Eye,
  EyeOff,
  RotateCcw,
  History,
  AlertTriangle,
} from 'lucide-react';

type TierStatus = 'founding_5' | 'founding_50' | 'general';

interface TierChangeLog {
  id: string;
  previous_tier: string;
  new_tier: string;
  previous_badge_visible: boolean;
  new_badge_visible: boolean;
  reason: string | null;
  created_at: string;
}

export default function AdminBusinesses() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [filterBadge, setFilterBadge] = useState<string>('all');
  const [filterOnboarding, setFilterOnboarding] = useState<string>('all');

  // Action modals
  const [assignModal, setAssignModal] = useState<{ open: boolean; business: any | null }>({ open: false, business: null });
  const [selectedTier, setSelectedTier] = useState<TierStatus>('general');
  const [revokeModal, setRevokeModal] = useState<{ open: boolean; business: any | null }>({ open: false, business: null });
  const [reason, setReason] = useState('');
  const [logModal, setLogModal] = useState<{ open: boolean; businessId: string | null }>({ open: false, businessId: null });

  const { data: businesses, isLoading } = useQuery({
    queryKey: ['admin-all-businesses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name, tier_status, tier_badge_visible, tier_assigned_at, tier_revoked_at, onboarding_completed, created_at, category:categories(name), neighborhood:neighborhoods(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Tier change log for a specific business
  const { data: tierLogs } = useQuery({
    queryKey: ['tier-logs', logModal.businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tier_change_log')
        .select('*')
        .eq('business_id', logModal.businessId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as TierChangeLog[];
    },
    enabled: !!logModal.businessId,
  });

  // Assign tier mutation
  const assignTier = useMutation({
    mutationFn: async ({ businessId, newTier }: { businessId: string; newTier: TierStatus }) => {
      const business = businesses?.find(b => b.id === businessId);
      if (!business || !user) return;

      // Log the change
      await supabase.from('tier_change_log').insert({
        business_id: businessId,
        changed_by: user.id,
        previous_tier: business.tier_status,
        new_tier: newTier,
        previous_badge_visible: business.tier_badge_visible,
        new_badge_visible: true,
        reason: reason || null,
      });

      // Update the business
      await supabase.from('businesses').update({
        tier_status: newTier,
        tier_badge_visible: true,
        tier_assigned_at: new Date().toISOString(),
        tier_assigned_by: user.id,
        tier_revoked_at: null,
        tier_revoked_by: null,
      }).eq('id', businessId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-businesses'] });
      toast({ title: 'Tier assigned successfully' });
      setAssignModal({ open: false, business: null });
      setReason('');
    },
  });

  // Toggle badge visibility
  const toggleBadge = useMutation({
    mutationFn: async ({ businessId, visible }: { businessId: string; visible: boolean }) => {
      const business = businesses?.find(b => b.id === businessId);
      if (!business || !user) return;

      await supabase.from('tier_change_log').insert({
        business_id: businessId,
        changed_by: user.id,
        previous_tier: business.tier_status,
        new_tier: business.tier_status,
        previous_badge_visible: business.tier_badge_visible,
        new_badge_visible: visible,
      });

      await supabase.from('businesses').update({
        tier_badge_visible: visible,
      }).eq('id', businessId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-businesses'] });
      toast({ title: 'Badge visibility updated' });
    },
  });

  // Revoke tier
  const revokeTier = useMutation({
    mutationFn: async ({ businessId }: { businessId: string }) => {
      const business = businesses?.find(b => b.id === businessId);
      if (!business || !user) return;

      await supabase.from('tier_change_log').insert({
        business_id: businessId,
        changed_by: user.id,
        previous_tier: business.tier_status,
        new_tier: 'general',
        previous_badge_visible: business.tier_badge_visible,
        new_badge_visible: false,
        reason: reason || null,
      });

      await supabase.from('businesses').update({
        tier_status: 'general',
        tier_badge_visible: false,
        tier_revoked_at: new Date().toISOString(),
        tier_revoked_by: user.id,
      }).eq('id', businessId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-businesses'] });
      toast({ title: 'Tier status revoked' });
      setRevokeModal({ open: false, business: null });
      setReason('');
    },
  });

  // Restore tier
  const restoreTier = useMutation({
    mutationFn: async ({ businessId, previousTier }: { businessId: string; previousTier: string }) => {
      if (!user) return;

      await supabase.from('tier_change_log').insert({
        business_id: businessId,
        changed_by: user.id,
        previous_tier: 'general',
        new_tier: previousTier,
        previous_badge_visible: false,
        new_badge_visible: true,
      });

      await supabase.from('businesses').update({
        tier_status: previousTier,
        tier_badge_visible: true,
        tier_revoked_at: null,
        tier_revoked_by: null,
      }).eq('id', businessId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-businesses'] });
      toast({ title: 'Tier restored' });
    },
  });

  // Stats
  const founding5Count = businesses?.filter(b => b.tier_status === 'founding_5').length || 0;
  const founding50Count = businesses?.filter(b => b.tier_status === 'founding_50').length || 0;
  const generalCount = businesses?.filter(b => b.tier_status === 'general').length || 0;
  const pendingOnboarding = businesses?.filter(b => !b.onboarding_completed).length || 0;

  // Filter
  const filtered = businesses?.filter(b => {
    if (searchQuery && !b.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterTier !== 'all' && b.tier_status !== filterTier) return false;
    if (filterBadge === 'visible' && !b.tier_badge_visible) return false;
    if (filterBadge === 'hidden' && b.tier_badge_visible) return false;
    if (filterOnboarding === 'completed' && !b.onboarding_completed) return false;
    if (filterOnboarding === 'pending' && b.onboarding_completed) return false;
    return true;
  });

  if (!isAdmin) {
    return (
      <>
        <Header title="Admin" />
        <PageContainer>
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Access Denied</p>
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header title="Business Management" />
      <PageContainer className="space-y-5">
        <Button variant="ghost" size="sm" className="mb-2 -ml-2" onClick={() => navigate('/admin')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Admin
        </Button>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card-elevated p-3 text-center">
            <p className="text-2xl font-bold text-amber-500">{founding5Count}<span className="text-sm text-muted-foreground">/5</span></p>
            <p className="text-xs text-muted-foreground">Founding 5</p>
          </div>
          <div className="card-elevated p-3 text-center">
            <p className="text-2xl font-bold text-slate-400">{founding50Count}<span className="text-sm text-muted-foreground">/50</span></p>
            <p className="text-xs text-muted-foreground">Founding 50</p>
          </div>
          <div className="card-elevated p-3 text-center">
            <p className="text-2xl font-bold">{generalCount}</p>
            <p className="text-xs text-muted-foreground">General</p>
          </div>
          <div className="card-elevated p-3 text-center">
            <p className="text-2xl font-bold text-lokal-terracotta">{pendingOnboarding}</p>
            <p className="text-xs text-muted-foreground">Pending Onboarding</p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search businesses..." className="pl-10" />
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <Select value={filterTier} onValueChange={setFilterTier}>
              <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="founding_5">Founding 5</SelectItem>
                <SelectItem value="founding_50">Founding 50</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterBadge} onValueChange={setFilterBadge}>
              <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Badges</SelectItem>
                <SelectItem value="visible">Badge Visible</SelectItem>
                <SelectItem value="hidden">Badge Hidden</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterOnboarding} onValueChange={setFilterOnboarding}>
              <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Onboarding</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Business List */}
        <div className="space-y-2">
          {filtered?.map(biz => (
            <div key={biz.id} className="card-elevated p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm">{biz.name}</h3>
                    <TierBadge tier={biz.tier_status as TierStatus} size="sm" visible={biz.tier_badge_visible} />
                    {!biz.tier_badge_visible && biz.tier_status !== 'general' && (
                      <Badge variant="outline" className="text-[10px] gap-1"><EyeOff className="h-3 w-3" /> Hidden</Badge>
                    )}
                    {!biz.onboarding_completed && (
                      <Badge variant="outline" className="text-[10px] text-lokal-terracotta border-lokal-terracotta/30">Onboarding</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{biz.category?.name} · {biz.neighborhood?.name}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {/* Assign Tier */}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  onClick={() => {
                    setAssignModal({ open: true, business: biz });
                    setSelectedTier(biz.tier_status as TierStatus);
                  }}
                >
                  <Crown className="h-3 w-3" /> Assign Tier
                </Button>

                {/* Toggle Badge */}
                {biz.tier_status !== 'general' && (
                  <div className="flex items-center gap-1.5 px-2 h-7 rounded-md border border-border text-xs">
                    {biz.tier_badge_visible ? <Eye className="h-3 w-3 text-success" /> : <EyeOff className="h-3 w-3 text-muted-foreground" />}
                    <Switch
                      checked={biz.tier_badge_visible}
                      onCheckedChange={(v) => toggleBadge.mutate({ businessId: biz.id, visible: v })}
                      className="scale-75"
                    />
                  </div>
                )}

                {/* Revoke */}
                {biz.tier_status !== 'general' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                    onClick={() => setRevokeModal({ open: true, business: biz })}
                  >
                    <AlertTriangle className="h-3 w-3" /> Revoke
                  </Button>
                )}

                {/* Restore */}
                {biz.tier_revoked_at && biz.tier_status === 'general' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1"
                    onClick={async () => {
                      // Get previous tier from log
                      const { data: logs } = await supabase
                        .from('tier_change_log')
                        .select('previous_tier')
                        .eq('business_id', biz.id)
                        .order('created_at', { ascending: false })
                        .limit(1);
                      const prevTier = logs?.[0]?.previous_tier || 'founding_50';
                      restoreTier.mutate({ businessId: biz.id, previousTier: prevTier });
                    }}
                  >
                    <RotateCcw className="h-3 w-3" /> Restore
                  </Button>
                )}

                {/* Audit Log */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs gap-1 ml-auto"
                  onClick={() => setLogModal({ open: true, businessId: biz.id })}
                >
                  <History className="h-3 w-3" /> Log
                </Button>
              </div>
            </div>
          ))}
        </div>
      </PageContainer>

      {/* Assign Tier Modal */}
      <Dialog open={assignModal.open} onOpenChange={(o) => !o && setAssignModal({ open: false, business: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Tier</DialogTitle>
            <DialogDescription>
              {assignModal.business?.name} — currently {assignModal.business?.tier_status}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>New Tier</Label>
              <Select value={selectedTier} onValueChange={(v) => setSelectedTier(v as TierStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="founding_5">Founding 5</SelectItem>
                  <SelectItem value="founding_50">Founding 50</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why this change?" rows={2} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAssignModal({ open: false, business: null })}>Cancel</Button>
              <Button onClick={() => assignTier.mutate({ businessId: assignModal.business!.id, newTier: selectedTier })} disabled={assignTier.isPending}>
                {assignTier.isPending ? 'Saving...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revoke Modal */}
      <Dialog open={revokeModal.open} onOpenChange={(o) => !o && setRevokeModal({ open: false, business: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Revoke Founding Status
            </DialogTitle>
            <DialogDescription>
              This will remove {revokeModal.business?.name}'s founding status and badge. They will be moved to General tier. This action is logged and can be reversed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why are you revoking?" rows={2} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRevokeModal({ open: false, business: null })}>Cancel</Button>
              <Button variant="destructive" onClick={() => revokeTier.mutate({ businessId: revokeModal.business!.id })} disabled={revokeTier.isPending}>
                {revokeTier.isPending ? 'Revoking...' : 'Revoke Status'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Audit Log Modal */}
      <Dialog open={logModal.open} onOpenChange={(o) => !o && setLogModal({ open: false, businessId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tier Change History</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {tierLogs?.length ? tierLogs.map(log => (
              <div key={log.id} className="p-3 rounded-lg bg-secondary text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <TierBadge tier={log.previous_tier as TierStatus} size="sm" />
                  <span>→</span>
                  <TierBadge tier={log.new_tier as TierStatus} size="sm" />
                </div>
                {log.reason && <p className="text-xs text-muted-foreground">{log.reason}</p>}
                <p className="text-[10px] text-muted-foreground">{new Date(log.created_at).toLocaleString()}</p>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-4">No changes logged</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
