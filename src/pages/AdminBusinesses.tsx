import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { TierBadge } from '@/components/business/TierBadge';
import { ImageCropUpload } from '@/components/business/ImageCropUpload';
import { SecureImage } from '@/components/ui/secure-image';
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
  Mail,
  Megaphone,
  Trash2,
  Star,
  Users,
  CheckCircle,
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { AdminBusinessStaffDialog } from '@/components/admin/AdminBusinessStaffDialog';

type TierStatus = 'founding_5' | 'founding_50' | 'community' | 'growth' | 'pro' | 'civic_partner';

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
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const initialTier = searchParams.get('tier') || 'all';
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<string>(initialTier);
  const [filterBadge, setFilterBadge] = useState<string>('all');
  const [filterOnboarding, setFilterOnboarding] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  type BusinessRecord = NonNullable<typeof businesses>[number];
  // Action modals
  const [assignModal, setAssignModal] = useState<{ open: boolean; business: BusinessRecord | null }>({ open: false, business: null });
  const [selectedTier, setSelectedTier] = useState<TierStatus>('community');
  const [revokeModal, setRevokeModal] = useState<{ open: boolean; business: BusinessRecord | null }>({ open: false, business: null });
  const [archiveModal, setArchiveModal] = useState<{ open: boolean; business: BusinessRecord | null }>({ open: false, business: null });
  const [reason, setReason] = useState('');
  const [logModal, setLogModal] = useState<{ open: boolean; businessId: string | null }>({ open: false, businessId: null });

  // Owner messaging
  const [messageModal, setMessageModal] = useState<{ open: boolean; business: BusinessRecord | null }>({ open: false, business: null });
  const [staffModal, setStaffModal] = useState<{ open: boolean; business: { id: string; name: string } | null }>({ open: false, business: null });
  const { can } = usePermissions();
  const [broadcastModal, setBroadcastModal] = useState(false);
  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [broadcastTier, setBroadcastTier] = useState<string>('all');

  const resetMessageForm = () => { setMsgSubject(''); setMsgBody(''); };

  const sendMessage = useMutation({
    mutationFn: async () => {
      const business = messageModal.business;
      if (!business?.owner_user_id) throw new Error('This business has no owner account to message.');
      const { data, error } = await supabase.functions.invoke('send-owner-message', {
        body: { mode: 'single', recipientUserId: business.owner_user_id, businessId: business.id, subject: msgSubject, body: msgBody },
      });
      if (error) throw error;
      return data as { sent: number; emailed: number };
    },
    onSuccess: (data) => {
      toast({ title: 'Message sent', description: `Delivered in-app${data?.emailed ? ' and by email' : ''}.` });
      setMessageModal({ open: false, business: null });
      resetMessageForm();
    },
    onError: (e: Error) => toast({ variant: 'destructive', title: 'Could not send', description: e.message }),
  });

  const sendBroadcast = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('send-owner-message', {
        body: { mode: 'broadcast', tierFilter: broadcastTier, subject: msgSubject, body: msgBody },
      });
      if (error) throw error;
      return data as { sent: number; emailed: number; total: number };
    },
    onSuccess: (data) => {
      toast({ title: 'Announcement sent', description: `Reached ${data?.sent ?? 0} owner${data?.sent === 1 ? '' : 's'} (${data?.emailed ?? 0} by email).` });
      setBroadcastModal(false);
      resetMessageForm();
    },
    onError: (e: Error) => toast({ variant: 'destructive', title: 'Could not send', description: e.message }),
  });

  const { data: businesses, isLoading } = useQuery({
    queryKey: ['admin-all-businesses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name, owner_user_id, status, tier_status, tier_badge_visible, tier_assigned_at, tier_revoked_at, onboarding_completed, created_at, category:categories!category_id(name), neighborhood:neighborhoods(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const archiveBusiness = useMutation({
    mutationFn: async ({ businessId }: { businessId: string }) => {
      const { error } = await supabase.from('businesses').update({ status: 'archived' }).eq('id', businessId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-businesses'] });
      toast({ title: 'Business removed', description: 'Hidden from the public site. You can restore it anytime.' });
      setArchiveModal({ open: false, business: null });
    },
    onError: (e: Error) => toast({ variant: 'destructive', title: 'Could not remove', description: e.message }),
  });

  const restoreBusiness = useMutation({
    mutationFn: async ({ businessId }: { businessId: string }) => {
      const { error } = await supabase.from('businesses').update({ status: 'approved' }).eq('id', businessId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-businesses'] });
      toast({ title: 'Business restored', description: 'Back on the public site.' });
    },
    onError: (e: Error) => toast({ variant: 'destructive', title: 'Could not restore', description: e.message }),
  });

  const approveBusiness = useMutation({
    mutationFn: async ({ businessId }: { businessId: string }) => {
      const { error } = await supabase.from('businesses').update({ status: 'approved' }).eq('id', businessId);
      if (error) throw error;
      // Fire-and-forget: send approval notification email
      supabase.functions.invoke('notify-business-approved', {
        body: { businessId },
      }).catch((err) => console.error('Approval email failed:', err));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-businesses'] });
      toast({ title: 'Business approved', description: 'Now live on the platform.' });
    },
    onError: (e: Error) => toast({ variant: 'destructive', title: 'Could not approve', description: e.message }),
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
      const { error: logError } = await supabase.from('tier_change_log').insert({
        business_id: businessId,
        changed_by: user.id,
        previous_tier: business.tier_status,
        new_tier: newTier,
        previous_badge_visible: business.tier_badge_visible,
        new_badge_visible: true,
        reason: reason || null,
      });
      if (logError) throw logError;

      // Update the business
      const { error: updateError } = await supabase.from('businesses').update({
        tier_status: newTier,
        tier_badge_visible: true,
        tier_assigned_at: new Date().toISOString(),
        tier_assigned_by: user.id,
        tier_revoked_at: null,
        tier_revoked_by: null,
      }).eq('id', businessId);
      if (updateError) throw updateError;
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

      const { error: logError } = await supabase.from('tier_change_log').insert({
        business_id: businessId,
        changed_by: user.id,
        previous_tier: business.tier_status,
        new_tier: business.tier_status,
        previous_badge_visible: business.tier_badge_visible,
        new_badge_visible: visible,
      });
      if (logError) throw logError;

      const { error: updateError } = await supabase.from('businesses').update({
        tier_badge_visible: visible,
      }).eq('id', businessId);
      if (updateError) throw updateError;
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

      const { error: logError } = await supabase.from('tier_change_log').insert({
        business_id: businessId,
        changed_by: user.id,
        previous_tier: business.tier_status,
        new_tier: 'community',
        previous_badge_visible: business.tier_badge_visible,
        new_badge_visible: false,
        reason: reason || null,
      });
      if (logError) throw logError;

      const { error: updateError } = await supabase.from('businesses').update({
        tier_status: 'community',
        tier_badge_visible: false,
        tier_revoked_at: new Date().toISOString(),
        tier_revoked_by: user.id,
      }).eq('id', businessId);
      if (updateError) throw updateError;
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

      const { error: logError } = await supabase.from('tier_change_log').insert({
        business_id: businessId,
        changed_by: user.id,
        previous_tier: 'community',
        new_tier: previousTier,
        previous_badge_visible: false,
        new_badge_visible: true,
      });
      if (logError) throw logError;

      const { error: updateError } = await supabase.from('businesses').update({
        tier_status: previousTier,
        tier_badge_visible: true,
        tier_revoked_at: null,
        tier_revoked_by: null,
      }).eq('id', businessId);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-businesses'] });
      toast({ title: 'Tier restored' });
    },
  });

  // Founding details editor (founding_number, quote, owner name + photo).
  // These columns are not in the generated types yet, so the queries are cast.
  const [foundingModal, setFoundingModal] = useState<{ open: boolean; business: { id: string; name: string } | null }>({ open: false, business: null });
  const [foundingNumber, setFoundingNumber] = useState('');
  const [foundingQuote, setFoundingQuote] = useState('');
  const [foundingOwnerName, setFoundingOwnerName] = useState('');
  const [foundingOwnerImage, setFoundingOwnerImage] = useState('');

  const openFoundingModal = async (biz: { id: string; name: string }) => {
    setFoundingModal({ open: true, business: biz });
    setFoundingNumber('');
    setFoundingQuote('');
    setFoundingOwnerName('');
    setFoundingOwnerImage('');
    const { data } = await supabase
      .from('businesses' as never)
      .select('founding_number, founding_quote, owner_name, owner_image_url')
      .eq('id', biz.id)
      .maybeSingle();
    const row = data as {
      founding_number: number | null;
      founding_quote: string | null;
      owner_name: string | null;
      owner_image_url: string | null;
    } | null;
    if (row) {
      setFoundingNumber(row.founding_number != null ? String(row.founding_number) : '');
      setFoundingQuote(row.founding_quote ?? '');
      setFoundingOwnerName(row.owner_name ?? '');
      setFoundingOwnerImage(row.owner_image_url ?? '');
    }
  };

  const saveFounding = useMutation({
    mutationFn: async () => {
      const biz = foundingModal.business;
      if (!biz) return;
      const trimmed = foundingNumber.trim();
      const num = trimmed === '' ? null : Number(trimmed);
      if (num !== null && (!Number.isInteger(num) || num < 1)) {
        throw new Error('Founding number must be a whole number above 0.');
      }
      const { error } = await supabase
        .from('businesses' as never)
        .update({
          founding_number: num,
          founding_quote: foundingQuote.trim() || null,
          owner_name: foundingOwnerName.trim() || null,
          owner_image_url: foundingOwnerImage.trim() || null,
        } as never)
        .eq('id', biz.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-businesses'] });
      queryClient.invalidateQueries({ queryKey: ['founding-members'] });
      toast({ title: 'Founding details saved' });
      setFoundingModal({ open: false, business: null });
    },
    onError: (e: Error & { code?: string }) => {
      const taken = e?.code === '23505' || /duplicate|unique/i.test(e?.message ?? '');
      toast({
        variant: 'destructive',
        title: 'Could not save',
        description: taken ? 'That founding number is already taken.' : e.message,
      });
    },
  });

  // Stats
  const founding5Count = businesses?.filter(b => b.tier_status === 'founding_5').length || 0;
  const founding50Count = businesses?.filter(b => b.tier_status === 'founding_50').length || 0;
  const proCount = businesses?.filter(b => b.tier_status === 'pro').length || 0;
  const growthCount = businesses?.filter(b => b.tier_status === 'growth').length || 0;
  const communityCount = businesses?.filter(b => b.tier_status === 'community').length || 0;
  const pendingOnboarding = businesses?.filter(b => !b.onboarding_completed).length || 0;
  const pendingApproval = businesses?.filter(b => b.status === 'pending').length || 0;

  // Filter
  const filtered = businesses?.filter(b => {
    if (searchQuery && !b.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterTier !== 'all' && b.tier_status !== filterTier) return false;
    if (filterBadge === 'visible' && !b.tier_badge_visible) return false;
    if (filterBadge === 'hidden' && b.tier_badge_visible) return false;
    if (filterOnboarding === 'completed' && !b.onboarding_completed) return false;
    if (filterOnboarding === 'pending' && b.onboarding_completed) return false;
    if (filterStatus !== 'all' && b.status !== filterStatus) return false;
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
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Admin
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { resetMessageForm(); setBroadcastModal(true); }}>
            <Megaphone className="h-4 w-4" /> Message owners
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {pendingApproval > 0 && (
            <button
              className="card-elevated p-3 text-center hover:ring-2 hover:ring-lokal-amber/40 transition-all min-w-[5.5rem] flex-shrink-0"
              onClick={() => setFilterStatus(filterStatus === 'pending' ? 'all' : 'pending')}
            >
              <p className="text-2xl font-bold text-lokal-amber">{pendingApproval}</p>
              <p className="text-[11px] text-muted-foreground whitespace-nowrap">Pending Approval</p>
            </button>
          )}
          <div className="card-elevated p-3 text-center min-w-[5.5rem] flex-shrink-0">
            <p className="text-2xl font-bold text-amber-500">{founding5Count}<span className="text-sm text-muted-foreground">/5</span></p>
            <p className="text-[11px] text-muted-foreground whitespace-nowrap">Founding 5</p>
          </div>
          <div className="card-elevated p-3 text-center min-w-[5.5rem] flex-shrink-0">
            <p className="text-2xl font-bold text-slate-400">{founding50Count}<span className="text-sm text-muted-foreground">/25</span></p>
            <p className="text-[11px] text-muted-foreground whitespace-nowrap">Founding 25</p>
          </div>
          <div className="card-elevated p-3 text-center min-w-[5.5rem] flex-shrink-0">
            <p className="text-2xl font-bold text-indigo-500">{proCount}</p>
            <p className="text-[11px] text-muted-foreground whitespace-nowrap">Pro</p>
          </div>
          <div className="card-elevated p-3 text-center min-w-[5.5rem] flex-shrink-0">
            <p className="text-2xl font-bold text-emerald-500">{growthCount}</p>
            <p className="text-[11px] text-muted-foreground whitespace-nowrap">Growth</p>
          </div>
          <div className="card-elevated p-3 text-center min-w-[5.5rem] flex-shrink-0">
            <p className="text-2xl font-bold">{communityCount}</p>
            <p className="text-[11px] text-muted-foreground whitespace-nowrap">Community</p>
          </div>
          <div className="card-elevated p-3 text-center min-w-[5.5rem] flex-shrink-0">
            <p className="text-2xl font-bold text-lokal-terracotta">{pendingOnboarding}</p>
            <p className="text-[11px] text-muted-foreground whitespace-nowrap">Pending Onboarding</p>
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
                <SelectItem value="founding_50">Founding 25</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="growth">Growth</SelectItem>
                <SelectItem value="civic_partner">Civic Partner</SelectItem>
                <SelectItem value="community">Community</SelectItem>
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
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
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
                    {!biz.tier_badge_visible && biz.tier_status !== 'community' && biz.tier_status !== 'growth' && (
                      <Badge variant="outline" className="text-[10px] gap-1"><EyeOff className="h-3 w-3" /> Hidden</Badge>
                    )}
                    {!biz.onboarding_completed && (
                      <Badge variant="outline" className="text-[10px] text-lokal-terracotta border-lokal-terracotta/30">Onboarding</Badge>
                    )}
                    {biz.status === 'pending' && (
                      <Badge variant="outline" className="text-[10px] gap-1 text-lokal-amber border-lokal-amber/30">
                        Pending
                      </Badge>
                    )}
                    {biz.status === 'archived' && (
                      <Badge variant="outline" className="text-[10px] gap-1 text-destructive border-destructive/30">
                        <Trash2 className="h-3 w-3" /> Removed
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{biz.category?.name} · {biz.neighborhood?.name}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {/* Approve pending business */}
                {biz.status === 'pending' && (
                  <Button
                    size="sm"
                    variant="default"
                    className="h-7 text-xs gap-1"
                    onClick={() => approveBusiness.mutate({ businessId: biz.id })}
                    disabled={approveBusiness.isPending}
                  >
                    <CheckCircle className="h-3 w-3" /> {approveBusiness.isPending ? 'Approving...' : 'Approve'}
                  </Button>
                )}

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

                {/* Founding details (number, quote, owner) */}
                {(biz.tier_status === 'founding_5' || biz.tier_status === 'founding_50') && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    onClick={() => openFoundingModal(biz)}
                  >
                    <Star className="h-3 w-3" /> Founding details
                  </Button>
                )}

                {/* Toggle Badge */}
                {biz.tier_status !== 'community' && biz.tier_status !== 'growth' && (
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
                {(biz.tier_status === 'founding_5' || biz.tier_status === 'founding_50' || biz.tier_status === 'pro') && (
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
                {biz.tier_revoked_at && biz.tier_status === 'community' && (
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

                {/* Manage staff (admin override) */}
                {can('manage_business_staff') && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    title="Attach or remove staff on this business"
                    onClick={() => setStaffModal({ open: true, business: { id: biz.id, name: biz.name } })}
                  >
                    <Users className="h-3 w-3" /> Staff
                  </Button>
                )}

                {/* Message owner */}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1 ml-auto"
                  disabled={!biz.owner_user_id}
                  title={biz.owner_user_id ? 'Message the owner' : 'No owner account linked'}
                  onClick={() => { resetMessageForm(); setMessageModal({ open: true, business: biz }); }}
                >
                  <Mail className="h-3 w-3" /> Message
                </Button>

                {/* Audit Log */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs gap-1"
                  onClick={() => setLogModal({ open: true, businessId: biz.id })}
                >
                  <History className="h-3 w-3" /> Log
                </Button>

                {/* Remove (archive) / Restore listing */}
                {biz.status === 'archived' ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1"
                    onClick={() => restoreBusiness.mutate({ businessId: biz.id })}
                    disabled={restoreBusiness.isPending}
                  >
                    <RotateCcw className="h-3 w-3" /> Restore listing
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                    onClick={() => setArchiveModal({ open: true, business: biz })}
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </PageContainer>

      {/* Remove (archive) confirmation */}
      <Dialog open={archiveModal.open} onOpenChange={(o) => !o && setArchiveModal({ open: false, business: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove this business?</DialogTitle>
            <DialogDescription>
              "{archiveModal.business?.name}" will be hidden from the public site immediately.
              This is reversible — you can restore it from this list at any time.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setArchiveModal({ open: false, business: null })}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={archiveBusiness.isPending}
              onClick={() => archiveModal.business && archiveBusiness.mutate({ businessId: archiveModal.business.id })}
            >
              {archiveBusiness.isPending ? 'Removing…' : 'Remove business'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                  <SelectItem value="founding_50">Founding 25</SelectItem>
                  <SelectItem value="pro">Pro / Anchor</SelectItem>
                  <SelectItem value="growth">Growth</SelectItem>
                  <SelectItem value="civic_partner">Civic Partner</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
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
              This will remove {revokeModal.business?.name}'s status and badge. They will be moved to Community tier. This action is logged and can be reversed.
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

      {/* Founding Details Modal */}
      <Dialog open={foundingModal.open} onOpenChange={(o) => !o && setFoundingModal({ open: false, business: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Founding details</DialogTitle>
            <DialogDescription>
              Shown on the Founding 5 page for {foundingModal.business?.name}. The hero photo uses
              the brand cover image set on its profile.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Founding number</Label>
              <Input
                type="number"
                min={1}
                value={foundingNumber}
                onChange={(e) => setFoundingNumber(e.target.value)}
                placeholder="1 to 5 for Founding 5"
              />
              <p className="text-xs text-muted-foreground">
                The permanent No. on the card. Leave blank to unset. Each number is used once.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Owner name</Label>
              <Input
                value={foundingOwnerName}
                onChange={(e) => setFoundingOwnerName(e.target.value)}
                placeholder="Maria Delgado"
              />
            </div>
            <div className="space-y-2">
              <Label>Owner photo</Label>
              {foundingOwnerImage && (
                <div className="flex items-center gap-2">
                  <div className="h-12 w-12 overflow-hidden rounded-full bg-muted ring-1 ring-border/60">
                    <SecureImage
                      storagePath={foundingOwnerImage}
                      alt=""
                      imgClassName="object-cover"
                      className="h-full w-full"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">Current photo. Upload to replace.</span>
                </div>
              )}
              <ImageCropUpload
                aspectRatio={1}
                shape="circle"
                maxFileSize={5}
                outputWidth={800}
                outputHeight={800}
                onUploadComplete={(url) => setFoundingOwnerImage(url)}
                placeholder="Upload owner photo"
                className="max-w-[140px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Owner quote</Label>
              <Textarea
                value={foundingQuote}
                onChange={(e) => setFoundingQuote(e.target.value)}
                rows={2}
                placeholder="One line in the owner's voice."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setFoundingModal({ open: false, business: null })}>
                Cancel
              </Button>
              <Button onClick={() => saveFounding.mutate()} disabled={saveFounding.isPending}>
                {saveFounding.isPending ? 'Saving...' : 'Save'}
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

      {/* Message Owner Modal */}
      <Dialog open={messageModal.open} onOpenChange={(o) => !o && setMessageModal({ open: false, business: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message owner</DialogTitle>
            <DialogDescription>
              To the owner of {messageModal.business?.name}. Sent to their inbox and email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Subject (optional)</Label>
              <Input value={msgSubject} onChange={(e) => setMsgSubject(e.target.value)} placeholder="What's this about?" />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea value={msgBody} onChange={(e) => setMsgBody(e.target.value)} placeholder="Write your message..." rows={5} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setMessageModal({ open: false, business: null })}>Cancel</Button>
              <Button onClick={() => sendMessage.mutate()} disabled={sendMessage.isPending || !msgBody.trim()}>
                {sendMessage.isPending ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Broadcast Modal */}
      <Dialog open={broadcastModal} onOpenChange={setBroadcastModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" /> Message owners
            </DialogTitle>
            <DialogDescription>
              Send an announcement to every business owner, or filter by tier. Each owner gets it in their inbox and by email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Send to</Label>
              <Select value={broadcastTier} onValueChange={setBroadcastTier}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All owners</SelectItem>
                  <SelectItem value="founding_5">Founding 5</SelectItem>
                  <SelectItem value="founding_50">Founding 25</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="growth">Growth</SelectItem>
                  <SelectItem value="civic_partner">Civic Partner</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject (optional)</Label>
              <Input value={msgSubject} onChange={(e) => setMsgSubject(e.target.value)} placeholder="Announcement subject" />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea value={msgBody} onChange={(e) => setMsgBody(e.target.value)} placeholder="Write your announcement..." rows={5} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setBroadcastModal(false)}>Cancel</Button>
              <Button onClick={() => sendBroadcast.mutate()} disabled={sendBroadcast.isPending || !msgBody.trim()}>
                {sendBroadcast.isPending ? 'Sending...' : 'Send announcement'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage staff (admin override) */}
      <AdminBusinessStaffDialog
        open={staffModal.open}
        onOpenChange={(o) => setStaffModal((prev) => ({ open: o, business: o ? prev.business : null }))}
        businessId={staffModal.business?.id ?? null}
        businessName={staffModal.business?.name ?? null}
      />
    </>
  );
}
