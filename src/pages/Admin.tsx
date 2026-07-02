import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { SecureImage } from '@/components/ui/secure-image';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { LoopAnalyticsDashboard } from '@/components/admin/LoopAnalyticsDashboard';
import { NonprofitAdmin } from '@/components/admin/NonprofitAdmin';
import { UsersAdmin } from '@/components/admin/UsersAdmin';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Building2,
  Tag,
  Calendar,
  Check,
  X,
  Star,
  ArrowLeft,
  Shield,
  Image as ImageIcon,
  Pencil,
  BarChart3,
  Award,
  Briefcase,
  Truck,
  Crown,
  Landmark,
  Heart,
  Users,
  Eye,
  Sparkles,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

interface EditDialogItem {
  id: string;
  name?: string | null;
  title?: string | null;
  photos?: string[] | null;
  editor_pick_image?: string | null;
  image_url?: string | null;
}

interface EditDialogState {
  open: boolean;
  type: 'business' | 'deal' | 'event' | null;
  item: EditDialogItem | null;
}

export default function Admin() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editDialog, setEditDialog] = useState<EditDialogState>({ open: false, type: null, item: null });
  const [editorPickImage, setEditorPickImage] = useState<string>('');
  const [mainPhoto, setMainPhoto] = useState<string>('');

  // Pending businesses
  const { data: pendingBusinesses } = useQuery({
    queryKey: ['admin-pending-businesses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('*, category:categories!category_id(name), neighborhood:neighborhoods(name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch owner names for display
      if (data && data.length > 0) {
        const ownerIds = data.map(b => b.owner_user_id).filter((id): id is string => id !== null);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name')
          .in('user_id', ownerIds);
        return data.map(b => ({
          ...b,
          owner_name: profiles?.find(p => p.user_id === b.owner_user_id)?.name || null,
        }));
      }
      return data?.map(b => ({ ...b, owner_name: null })) || [];
    },
    enabled: isAdmin,
  });

  // Approved businesses for editing (with loop settings for Founding 5)
  const { data: approvedBusinesses } = useQuery({
    queryKey: ['admin-approved-businesses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('*, category:categories!category_id(name), neighborhood:neighborhoods(name), business_loop_settings(is_founding_member, is_founding_50, loop_tier_id)')
        .eq('status', 'approved')
        .order('featured', { ascending: false })
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const foundingMemberCount = approvedBusinesses?.filter(b => b.tier_status === 'founding_5').length || 0;
  const founding25Count = approvedBusinesses?.filter(b => b.tier_status === 'founding_25').length || 0;
  const founding5NonprofitCount = approvedBusinesses?.filter(b => b.tier_status === 'founding_5_nonprofit').length || 0;

  // Pending deals
  const { data: pendingDeals } = useQuery({
    queryKey: ['admin-pending-deals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select('*, business:businesses(name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Pending events
  const { data: pendingEvents } = useQuery({
    queryKey: ['admin-pending-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*, business:businesses(name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Pending jobs
  const { data: pendingJobs } = useQuery({
    queryKey: ['admin-pending-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*, business:businesses(name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Pending food truck locations
  const { data: pendingFoodLocations } = useQuery({
    queryKey: ['admin-pending-food-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('food_truck_locations')
        .select('*, business:businesses(name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Founding 5 applications
  const { data: foundingApplications } = useQuery({
    queryKey: ['admin-founding-applications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('founding_5_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const updateBusinessStatus = useMutation({
    mutationFn: async ({ id, status, featured, name: bizName }: { id: string; status?: string; featured?: boolean; name?: string }) => {
      const updates: Record<string, string | boolean> = {};
      if (status !== undefined) updates.status = status;
      if (featured !== undefined) updates.featured = featured;

      // Generate a slug when approving if the business doesn't have one
      if (status === 'approved' && bizName) {
        const { data: existing } = await supabase
          .from('businesses')
          .select('slug')
          .eq('id', id)
          .single();
        if (!existing?.slug) {
          const base = bizName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          const { data: conflicts } = await supabase
            .from('businesses')
            .select('slug')
            .like('slug', `${base}%`);
          updates.slug = conflicts?.length ? `${base}-${conflicts.length}` : base;
        }
      }

      const { error } = await supabase
        .from('businesses')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-businesses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-approved-businesses'] });
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      toast({ title: 'Business updated' });
    },
    onError: (err) => {
      toast({ variant: 'destructive', title: 'Error', description: err instanceof Error ? err.message : 'Failed to update business' });
    },
  });

  const updateBusinessImages = useMutation({
    mutationFn: async ({ id, photos, editorPickImage }: { id: string; photos?: string[]; editorPickImage?: string }) => {
      const updates: Record<string, string[] | string> = {};
      if (photos !== undefined) updates.photos = photos;
      if (editorPickImage !== undefined) updates.editor_pick_image = editorPickImage;

      const { error } = await supabase
        .from('businesses')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-businesses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-approved-businesses'] });
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      toast({ title: 'Images updated' });
      setEditDialog({ open: false, type: null, item: null });
    },
    onError: (err) => {
      toast({ variant: 'destructive', title: 'Error', description: err instanceof Error ? err.message : 'Failed to update images' });
    },
  });

  const updateDealStatus = useMutation({
    mutationFn: async ({ id, status, featured, imageUrl }: { id: string; status?: string; featured?: boolean; imageUrl?: string }) => {
      const updates: Record<string, string | boolean> = {};
      if (status !== undefined) updates.status = status;
      if (featured !== undefined) updates.featured = featured;
      if (imageUrl !== undefined) updates.image_url = imageUrl;

      const { error } = await supabase
        .from('deals')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-deals'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast({ title: 'Deal updated' });
      setEditDialog({ open: false, type: null, item: null });
    },
    onError: (err) => {
      toast({ variant: 'destructive', title: 'Error', description: err instanceof Error ? err.message : 'Failed to update deal' });
    },
  });

  const updateEventStatus = useMutation({
    mutationFn: async ({ id, status, featured, imageUrl }: { id: string; status?: string; featured?: boolean; imageUrl?: string }) => {
      const updates: Record<string, string | boolean> = {};
      if (status !== undefined) updates.status = status;
      if (featured !== undefined) updates.featured = featured;
      if (imageUrl !== undefined) updates.image_url = imageUrl;

      const { error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({ title: 'Event updated' });
      setEditDialog({ open: false, type: null, item: null });
    },
    onError: (err) => {
      toast({ variant: 'destructive', title: 'Error', description: err instanceof Error ? err.message : 'Failed to update event' });
    },
  });

  const updateJobStatus = useMutation({
    mutationFn: async ({ id, status, featured }: { id: string; status?: string; featured?: boolean }) => {
      const updates: Record<string, string | boolean> = {};
      if (status !== undefined) updates.status = status;
      if (featured !== undefined) updates.featured = featured;

      const { error } = await supabase
        .from('jobs')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast({ title: 'Job updated' });
    },
    onError: (err) => {
      toast({ variant: 'destructive', title: 'Error', description: err instanceof Error ? err.message : 'Failed to update job' });
    },
  });

  const updateFoodLocationStatus = useMutation({
    mutationFn: async ({ id, status, featured }: { id: string; status?: string; featured?: boolean }) => {
      const updates: Record<string, string | boolean> = {};
      if (status !== undefined) updates.status = status;
      if (featured !== undefined) updates.featured = featured;

      const { error } = await supabase
        .from('food_truck_locations')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-food-locations'] });
      queryClient.invalidateQueries({ queryKey: ['food-truck-locations'] });
      toast({ title: 'Food location updated' });
    },
    onError: (err) => {
      toast({ variant: 'destructive', title: 'Error', description: err instanceof Error ? err.message : 'Failed to update food location' });
    },
  });

  // Delete founding 5 application
  const deleteFoundingApplication = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('founding_5_applications')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-founding-applications'] });
      toast({ title: 'Application removed' });
    },
    onError: (err) => {
      toast({ variant: 'destructive', title: 'Error', description: err instanceof Error ? err.message : 'Failed to remove application' });
    },
  });

  // Toggle Founding 5 status
  const toggleFoundingMember = useMutation({
    mutationFn: async ({ businessId, isFoundingMember }: { businessId: string; isFoundingMember: boolean }) => {
      const { data: existing } = await supabase
        .from('business_loop_settings')
        .select('id')
        .eq('business_id', businessId)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('business_loop_settings')
          .update({ 
            is_founding_member: isFoundingMember,
            ...(isFoundingMember ? { loop_tier_id: 'pro', is_active: true } : {})
          })
          .eq('business_id', businessId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('business_loop_settings')
          .insert({ 
            business_id: businessId,
            is_founding_member: isFoundingMember,
            loop_tier_id: isFoundingMember ? 'pro' : 'community',
            is_active: isFoundingMember
          });
        if (error) throw error;
      }

      // Also update the tier_status on the business itself
      await supabase.from('businesses').update({
        tier_status: isFoundingMember ? 'founding_5' : 'community',
        tier_badge_visible: true,
        tier_assigned_at: new Date().toISOString(),
        tier_assigned_by: user!.id,
      }).eq('id', businessId);
    },
    onSuccess: (_, { isFoundingMember }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-approved-businesses'] });
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      toast({ 
        title: isFoundingMember ? 'Founding 5 member added!' : 'Founding 5 status removed',
        description: isFoundingMember ? 'They now have all Loop benefits free for life.' : undefined
      });
    },
  });

  // Toggle Founding 25 status
  const toggleFounding25 = useMutation({
    mutationFn: async ({ businessId, isFounding25 }: { businessId: string; isFounding25: boolean }) => {
      const { data: existing } = await supabase
        .from('business_loop_settings')
        .select('id')
        .eq('business_id', businessId)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('business_loop_settings')
          .update({
            is_founding_50: isFounding25,
            ...(isFounding25 ? { is_active: true } : {})
          })
          .eq('business_id', businessId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('business_loop_settings')
          .insert({
            business_id: businessId,
            is_founding_50: isFounding25,
            loop_tier_id: 'community',
            is_active: isFounding25
          });
        if (error) throw error;
      }

      await supabase.from('businesses').update({
        tier_status: isFounding25 ? 'founding_25' : 'community',
        tier_badge_visible: true,
        tier_assigned_at: new Date().toISOString(),
        tier_assigned_by: user!.id,
      }).eq('id', businessId);
    },
    onSuccess: (_, { isFounding25 }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-approved-businesses'] });
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      toast({
        title: isFounding25 ? 'Founding 25 member added!' : 'Founding 25 status removed',
        description: isFounding25 ? 'They now get a permanent 50% discount on paid tiers.' : undefined
      });
    },
  });

  const toggleCivicPartner = useMutation({
    mutationFn: async ({ businessId, isCivic }: { businessId: string; isCivic: boolean }) => {
      await supabase.from('businesses').update({
        tier_status: isCivic ? 'civic_partner' : 'community',
        tier_badge_visible: true,
        tier_assigned_at: new Date().toISOString(),
        tier_assigned_by: user!.id,
      }).eq('id', businessId);
    },
    onSuccess: (_, { isCivic }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-approved-businesses'] });
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      toast({
        title: isCivic ? 'Civic Partner assigned!' : 'Civic Partner status removed',
        description: isCivic ? 'They can now post events and appear as a civic org.' : undefined
      });
    },
  });

  const toggleFounding5Nonprofit = useMutation({
    mutationFn: async ({ businessId, isF5Nonprofit }: { businessId: string; isF5Nonprofit: boolean }) => {
      await supabase.from('businesses').update({
        tier_status: isF5Nonprofit ? 'founding_5_nonprofit' : 'community',
        tier_badge_visible: true,
        tier_assigned_at: new Date().toISOString(),
        tier_assigned_by: user!.id,
      }).eq('id', businessId);
    },
    onSuccess: (_, { isF5Nonprofit }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-approved-businesses'] });
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      toast({
        title: isF5Nonprofit ? 'Founding 5 Nonprofit assigned!' : 'Founding 5 Nonprofit status removed',
        description: isF5Nonprofit ? 'They now appear with a teal badge on the Founding 5 page.' : undefined
      });
    },
  });

  const openEditDialog = (type: 'business' | 'deal' | 'event', item: EditDialogItem) => {
    setEditDialog({ open: true, type, item });
    if (type === 'business') {
      setEditorPickImage(item.editor_pick_image || '');
      setMainPhoto(item.photos?.[0] || '');
    } else {
      setMainPhoto(item.image_url || '');
    }
  };

  const handleSaveImages = () => {
    if (editDialog.type === 'business' && editDialog.item) {
      const photos = mainPhoto ? [mainPhoto, ...(editDialog.item.photos?.slice(1) || [])] : editDialog.item.photos || [];
      updateBusinessImages.mutate({
        id: editDialog.item.id,
        photos,
        editorPickImage: editorPickImage || undefined
      });
    } else if (editDialog.type === 'deal' && editDialog.item) {
      updateDealStatus.mutate({
        id: editDialog.item.id,
        imageUrl: mainPhoto || undefined
      });
    } else if (editDialog.type === 'event' && editDialog.item) {
      updateEventStatus.mutate({
        id: editDialog.item.id,
        imageUrl: mainPhoto || undefined
      });
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (!isAdmin) {
    return (
      <>
        <Header title="Admin" />
        <PageContainer>
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have admin privileges.</p>
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header title="Admin Panel" />
      
      <PageContainer>
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-4 -ml-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>

        <Tabs defaultValue={new URLSearchParams(window.location.search).get('tab') || 'analytics'} className="w-full">
          <TabsList className="w-full mb-4 overflow-x-auto">
            <TabsTrigger value="analytics" className="flex-1 gap-1.5">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="businesses" className="flex-1 gap-1.5">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Pending</span>
              {pendingBusinesses && pendingBusinesses.length > 0 && (
                <Badge variant="secondary" className="ml-1">{pendingBusinesses.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="deals" className="flex-1 gap-1.5">
              <Tag className="h-4 w-4" />
              <span className="hidden sm:inline">Deals</span>
              {pendingDeals && pendingDeals.length > 0 && (
                <Badge variant="secondary" className="ml-1">{pendingDeals.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="events" className="flex-1 gap-1.5">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Events</span>
              {pendingEvents && pendingEvents.length > 0 && (
                <Badge variant="secondary" className="ml-1">{pendingEvents.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex-1 gap-1.5">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Jobs</span>
              {pendingJobs && pendingJobs.length > 0 && (
                <Badge variant="secondary" className="ml-1">{pendingJobs.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="food" className="flex-1 gap-1.5">
              <Truck className="h-4 w-4" />
              <span className="hidden sm:inline">Food</span>
              {pendingFoodLocations && pendingFoodLocations.length > 0 && (
                <Badge variant="secondary" className="ml-1">{pendingFoodLocations.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="founding" className="flex-1 gap-1.5">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">F5 Apps</span>
              {foundingApplications && foundingApplications.length > 0 && (
                <Badge variant="secondary" className="ml-1">{foundingApplications.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="nonprofits" className="flex-1 gap-1.5">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Community</span>
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex-1 gap-1.5">
              <ImageIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Manage</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-1 gap-1.5">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            {/* Platform Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="card-elevated p-3 text-center">
                <p className="text-2xl font-bold">{approvedBusinesses?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Approved Businesses</p>
              </div>
              <div className="card-elevated p-3 text-center">
                <p className="text-2xl font-bold text-lokal-terracotta">{pendingBusinesses?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Pending Approval</p>
              </div>
              <div className="card-elevated p-3 text-center">
                <p className="text-2xl font-bold text-amber-500">{foundingMemberCount}/5</p>
                <p className="text-xs text-muted-foreground">Founding 5</p>
              </div>
              <div className="card-elevated p-3 text-center">
                <p className="text-2xl font-bold text-slate-400">{founding25Count}/25</p>
                <p className="text-xs text-muted-foreground">Founding 25</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 mb-6">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/admin/businesses')}>
                <Crown className="h-4 w-4" />
                Full Business Management
              </Button>
            </div>

            <AnalyticsDashboard />
            <div className="mt-8">
              <LoopAnalyticsDashboard />
            </div>
          </TabsContent>

          <TabsContent value="nonprofits">
            <NonprofitAdmin />
          </TabsContent>

          <TabsContent value="businesses" className="space-y-3">
            {pendingBusinesses?.length ? (
              pendingBusinesses.map(biz => (
                <div key={biz.id} className="card-elevated p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold">{biz.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {biz.category?.name} · {biz.neighborhood?.name}
                      </p>
                      {(biz.owner_name || biz.phone) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {biz.owner_name ? `Submitted by ${biz.owner_name}` : ''}{biz.phone ? ` · ${biz.phone}` : ''}
                        </p>
                      )}
                      {biz.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {biz.description}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {new Date(biz.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Button
                      size="sm"
                      onClick={() => updateBusinessStatus.mutate({ id: biz.id, status: 'approved', name: biz.name })}
                      disabled={updateBusinessStatus.isPending}
                      className="gap-1"
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateBusinessStatus.mutate({ id: biz.id, status: 'rejected' })}
                      disabled={updateBusinessStatus.isPending}
                      className="gap-1"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditDialog('business', biz)}
                      className="gap-1"
                    >
                      <ImageIcon className="h-4 w-4" />
                      Images
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateBusinessStatus.mutate({ id: biz.id, status: 'approved', featured: true })}
                      className="gap-1 ml-auto"
                    >
                      <Star className="h-4 w-4" />
                      Feature
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No pending businesses</p>
            )}
          </TabsContent>

          <TabsContent value="deals" className="space-y-3">
            {pendingDeals?.length ? (
              pendingDeals.map(deal => (
                <div key={deal.id} className="card-elevated p-4">
                  <div className="flex-1">
                    <h3 className="font-semibold">{deal.title}</h3>
                    <p className="text-sm text-muted-foreground">{deal.business?.name}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Button
                      size="sm"
                      onClick={() => updateDealStatus.mutate({ id: deal.id, status: 'approved' })}
                      className="gap-1"
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateDealStatus.mutate({ id: deal.id, status: 'rejected' })}
                      className="gap-1"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditDialog('deal', deal)}
                      className="gap-1"
                    >
                      <ImageIcon className="h-4 w-4" />
                      Image
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No pending deals</p>
            )}
          </TabsContent>

          <TabsContent value="events" className="space-y-3">
            {pendingEvents?.length ? (
              pendingEvents.map(event => (
                <div key={event.id} className="card-elevated p-4">
                  <div className="flex-1">
                    <h3 className="font-semibold">{event.title}</h3>
                    <p className="text-sm text-muted-foreground">{event.business?.name}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Button
                      size="sm"
                      onClick={() => updateEventStatus.mutate({ id: event.id, status: 'approved' })}
                      className="gap-1"
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateEventStatus.mutate({ id: event.id, status: 'rejected' })}
                      className="gap-1"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditDialog('event', event)}
                      className="gap-1"
                    >
                      <ImageIcon className="h-4 w-4" />
                      Image
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No pending events</p>
            )}
          </TabsContent>

          <TabsContent value="jobs" className="space-y-3">
            {pendingJobs?.length ? (
              pendingJobs.map(job => (
                <div key={job.id} className="card-elevated p-4">
                  <div className="flex-1">
                    <h3 className="font-semibold">{job.title}</h3>
                    <p className="text-sm text-muted-foreground">{job.business?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {job.job_type} · ${job.pay_min}{job.pay_max && ` - $${job.pay_max}`}/{job.pay_type || 'hour'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Button
                      size="sm"
                      onClick={() => updateJobStatus.mutate({ id: job.id, status: 'approved' })}
                      className="gap-1"
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateJobStatus.mutate({ id: job.id, status: 'rejected' })}
                      className="gap-1"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateJobStatus.mutate({ id: job.id, status: 'approved', featured: true })}
                      className="gap-1 ml-auto"
                    >
                      <Star className="h-4 w-4" />
                      Feature
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No pending jobs</p>
            )}
          </TabsContent>

          <TabsContent value="food" className="space-y-3">
            {pendingFoodLocations?.length ? (
              pendingFoodLocations.map(location => (
                <div key={location.id} className="card-elevated p-4">
                  <div className="flex-1">
                    <h3 className="font-semibold">{location.location_name}</h3>
                    <p className="text-sm text-muted-foreground">{location.business?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {location.location_date} · {location.start_time} - {location.end_time}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Button
                      size="sm"
                      onClick={() => updateFoodLocationStatus.mutate({ id: location.id, status: 'approved' })}
                      className="gap-1"
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateFoodLocationStatus.mutate({ id: location.id, status: 'rejected' })}
                      className="gap-1"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateFoodLocationStatus.mutate({ id: location.id, status: 'approved', featured: true })}
                      className="gap-1 ml-auto"
                    >
                      <Star className="h-4 w-4" />
                      Feature
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No pending food truck locations</p>
            )}
          </TabsContent>

          <TabsContent value="founding" className="space-y-3">
            {foundingApplications?.length ? (
              foundingApplications.map(app => (
                <div key={app.id} className="card-elevated p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold">{app.business_name}</h3>
                      <p className="text-sm text-muted-foreground">{app.owner_name}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <a href={`mailto:${app.email}`} className="hover:underline">{app.email}</a>
                        </span>
                        {app.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <a href={`tel:${app.phone}`} className="hover:underline">{app.phone}</a>
                          </span>
                        )}
                        {app.neighborhood && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {app.neighborhood}
                          </span>
                        )}
                        {app.category && (
                          <Badge variant="outline" className="text-[10px]">{app.category}</Badge>
                        )}
                      </div>
                      {app.why_us && (
                        <p className="text-sm text-muted-foreground mt-3 whitespace-pre-line">{app.why_us}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground/60 mt-2">
                        {new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteFoundingApplication.mutate(app.id)}
                      disabled={deleteFoundingApplication.isPending}
                      className="gap-1"
                    >
                      <X className="h-4 w-4" />
                      Dismiss
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No Founding 5 applications</p>
            )}
          </TabsContent>

          <TabsContent value="manage" className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Manage tiers, images & featured status.
                </p>
                <Button variant="link" size="sm" className="px-0 h-auto text-xs" onClick={() => navigate('/admin/businesses')}>
                  Full Business Management →
                </Button>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="gap-1 bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 dark:from-amber-950/30 dark:to-yellow-950/30 dark:border-amber-800">
                  <Crown className="h-3 w-3 text-amber-600" />
                  <span className="text-amber-700 dark:text-amber-400">{foundingMemberCount}/5</span>
                </Badge>
                <Badge variant="outline" className="gap-1 bg-gradient-to-r from-slate-50 to-gray-50 border-slate-300 dark:from-slate-950/30 dark:to-gray-950/30 dark:border-slate-700">
                  <Shield className="h-3 w-3 text-slate-500" />
                  <span className="text-slate-600 dark:text-slate-400">{founding25Count}/25</span>
                </Badge>
              </div>
            </div>
            {approvedBusinesses?.length ? (
              approvedBusinesses.map(biz => {
                const isFoundingMember = biz.business_loop_settings?.is_founding_member || false;
                const isFounding25 = biz.tier_status === 'founding_25';
                const isCivicPartner = biz.tier_status === 'civic_partner';
                const isF5Nonprofit = biz.tier_status === 'founding_5_nonprofit';
                const highlightClass = isFoundingMember
                  ? 'ring-2 ring-amber-400/50 bg-gradient-to-r from-amber-50/50 to-yellow-50/50 dark:from-amber-950/20 dark:to-yellow-950/20'
                  : isF5Nonprofit
                  ? 'ring-2 ring-emerald-400/50 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20'
                  : isFounding25
                  ? 'ring-2 ring-slate-300/50 bg-gradient-to-r from-slate-50/50 to-gray-50/50 dark:from-slate-950/20 dark:to-gray-950/20'
                  : isCivicPartner
                  ? 'ring-2 ring-teal-400/50 bg-gradient-to-r from-teal-50/50 to-emerald-50/50 dark:from-teal-950/20 dark:to-emerald-950/20'
                  : '';
                return (
                  <div key={biz.id} className={`card-elevated p-4 ${highlightClass}`}>
                    <div className="flex items-center gap-3">
                      {biz.photos?.[0] && (
                        <SecureImage
                          storagePath={biz.photos[0]}
                          alt={biz.name}
                          className="w-16 h-16 rounded-lg object-cover"
                          loading="lazy"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm">{biz.name}</h3>
                          {isFoundingMember && (
                            <Badge className="gap-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 text-[10px]">
                              <Crown className="h-3 w-3" />
                              Founding 5
                            </Badge>
                          )}
                          {isFounding25 && (
                            <Badge className="gap-1 bg-gradient-to-r from-slate-400 to-gray-400 text-white border-0 text-[10px]">
                              <Shield className="h-3 w-3" />
                              Founding 25
                            </Badge>
                          )}
                          {isCivicPartner && (
                            <Badge className="gap-1 bg-gradient-to-r from-teal-600 to-emerald-500 text-white border-0 text-[10px]">
                              <Landmark className="h-3 w-3" />
                              Civic Partner
                            </Badge>
                          )}
                          {isF5Nonprofit && (
                            <Badge className="gap-1 bg-gradient-to-r from-emerald-600 to-teal-500 text-white border-0 text-[10px]">
                              <Heart className="h-3 w-3" />
                              F5 Nonprofit
                            </Badge>
                          )}
                          {biz.featured && (
                            <Badge variant="secondary" className="gap-1 text-[10px]">
                              <Star className="h-3 w-3" />
                              Featured
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {biz.category?.name} · {biz.neighborhood?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {/* Founding 5 Toggle */}
                      <Button
                        size="sm"
                        variant={isFoundingMember ? "secondary" : "ghost"}
                        onClick={() => {
                          if (!isFoundingMember && foundingMemberCount >= 5) {
                            toast({ 
                              title: 'Founding 5 is full',
                              description: 'Remove a founding member first.',
                              variant: 'destructive'
                            });
                            return;
                          }
                          toggleFoundingMember.mutate({ businessId: biz.id, isFoundingMember: !isFoundingMember });
                        }}
                        className={`h-7 text-xs gap-1 ${isFoundingMember ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:from-amber-600 hover:to-yellow-600' : ''}`}
                        title={isFoundingMember ? 'Remove from Founding 5' : 'Add to Founding 5'}
                        disabled={toggleFoundingMember.isPending || isFounding25}
                      >
                        <Crown className="h-3 w-3" />
                        F5
                      </Button>

                      {/* Founding 25 Toggle */}
                      <Button
                        size="sm"
                        variant={isFounding25 ? "secondary" : "ghost"}
                        onClick={() => {
                          if (!isFounding25 && founding25Count >= 25) {
                            toast({ 
                              title: 'Founding 25 is full',
                              description: 'Remove a member first.',
                              variant: 'destructive'
                            });
                            return;
                          }
                          toggleFounding25.mutate({ businessId: biz.id, isFounding25: !isFounding25 });
                        }}
                        className={`h-7 text-xs gap-1 ${isFounding25 ? 'bg-gradient-to-r from-slate-400 to-gray-400 text-white hover:from-slate-500 hover:to-gray-500' : ''}`}
                        title={isFounding25 ? 'Remove from Founding 25' : 'Add to Founding 25'}
                        disabled={toggleFounding25.isPending || isFoundingMember}
                      >
                        <Shield className="h-3 w-3" />
                        F25
                      </Button>

                      {/* Civic Partner Toggle */}
                      <Button
                        size="sm"
                        variant={isCivicPartner ? "secondary" : "ghost"}
                        onClick={() => {
                          toggleCivicPartner.mutate({ businessId: biz.id, isCivic: !isCivicPartner });
                        }}
                        className={`h-7 text-xs gap-1 ${isCivicPartner ? 'bg-gradient-to-r from-teal-600 to-emerald-500 text-white hover:from-teal-700 hover:to-emerald-600' : ''}`}
                        title={isCivicPartner ? 'Remove Civic Partner' : 'Assign Civic Partner'}
                        disabled={toggleCivicPartner.isPending || isFoundingMember || isFounding25 || isF5Nonprofit}
                      >
                        <Landmark className="h-3 w-3" />
                        Civic
                      </Button>

                      {/* Founding 5 Nonprofit Toggle */}
                      <Button
                        size="sm"
                        variant={isF5Nonprofit ? "secondary" : "ghost"}
                        onClick={() => {
                          toggleFounding5Nonprofit.mutate({ businessId: biz.id, isF5Nonprofit: !isF5Nonprofit });
                        }}
                        className={`h-7 text-xs gap-1 ${isF5Nonprofit ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white hover:from-emerald-700 hover:to-teal-600' : ''}`}
                        title={isF5Nonprofit ? 'Remove Founding 5 Nonprofit' : 'Assign Founding 5 Nonprofit'}
                        disabled={toggleFounding5Nonprofit.isPending || isFoundingMember || isFounding25 || isCivicPartner}
                      >
                        <Heart className="h-3 w-3" />
                        F5NP
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog('business', biz)}
                        className="h-7 text-xs gap-1"
                      >
                        <Pencil className="h-3 w-3" />
                        Images
                      </Button>
                      <Button
                        size="sm"
                        variant={biz.featured ? "secondary" : "ghost"}
                        onClick={() => updateBusinessStatus.mutate({ id: biz.id, featured: !biz.featured })}
                        className="h-7 text-xs gap-1"
                        title="Featured"
                      >
                        <Star className={`h-3 w-3 ${biz.featured ? 'fill-current' : ''}`} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs gap-1 ml-auto"
                        onClick={() => navigate(`/business/${biz.id}`)}
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-muted-foreground py-8">No approved businesses yet</p>
            )}
          </TabsContent>
          <TabsContent value="users">
            <UsersAdmin />
          </TabsContent>
        </Tabs>
      </PageContainer>

      {/* Edit Images Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => !open && setEditDialog({ open: false, type: null, item: null })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editDialog.type === 'business' ? 'Edit Business Images' : `Edit ${editDialog.type} Image`}
            </DialogTitle>
            <DialogDescription>
              {editDialog.item?.name || editDialog.item?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div>
              <Label className="mb-2 block">Main Photo</Label>
              <ImageUpload
                currentUrl={mainPhoto}
                onUpload={setMainPhoto}
                onRemove={() => setMainPhoto('')}
                folder={editDialog.type || 'admin'}
                label="Upload Main Photo"
              />
            </div>

            {editDialog.type === 'business' && (
              <div>
                <Label className="mb-2 block">Editor's Pick Image</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  A curated hero image for featured sections
                </p>
                <ImageUpload
                  currentUrl={editorPickImage}
                  onUpload={setEditorPickImage}
                  onRemove={() => setEditorPickImage('')}
                  folder="editors-picks"
                  label="Upload Editor's Pick"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditDialog({ open: false, type: null, item: null })}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveImages}
                disabled={updateBusinessImages.isPending || updateDealStatus.isPending || updateEventStatus.isPending}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
