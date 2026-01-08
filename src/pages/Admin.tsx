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
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
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
  BarChart3
} from 'lucide-react';

interface EditDialogState {
  open: boolean;
  type: 'business' | 'deal' | 'event' | null;
  item: any;
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
        .select('*, category:categories(name), neighborhood:neighborhoods(name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Approved businesses for editing
  const { data: approvedBusinesses } = useQuery({
    queryKey: ['admin-approved-businesses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('*, category:categories(name), neighborhood:neighborhoods(name)')
        .eq('status', 'approved')
        .order('featured', { ascending: false })
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

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

  const updateBusinessStatus = useMutation({
    mutationFn: async ({ id, status, featured }: { id: string; status?: string; featured?: boolean }) => {
      const updates: Record<string, any> = {};
      if (status !== undefined) updates.status = status;
      if (featured !== undefined) updates.featured = featured;
      
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
  });

  const updateBusinessImages = useMutation({
    mutationFn: async ({ id, photos, editorPickImage }: { id: string; photos?: string[]; editorPickImage?: string }) => {
      const updates: Record<string, any> = {};
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
  });

  const updateDealStatus = useMutation({
    mutationFn: async ({ id, status, featured, imageUrl }: { id: string; status?: string; featured?: boolean; imageUrl?: string }) => {
      const updates: Record<string, any> = {};
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
  });

  const updateEventStatus = useMutation({
    mutationFn: async ({ id, status, featured, imageUrl }: { id: string; status?: string; featured?: boolean; imageUrl?: string }) => {
      const updates: Record<string, any> = {};
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
  });

  const openEditDialog = (type: 'business' | 'deal' | 'event', item: any) => {
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

        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="analytics" className="flex-1 gap-1.5">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="businesses" className="flex-1 gap-1.5">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Businesses</span>
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
            <TabsTrigger value="manage" className="flex-1 gap-1.5">
              <ImageIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Manage</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
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
                      {biz.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {biz.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Button
                      size="sm"
                      onClick={() => updateBusinessStatus.mutate({ id: biz.id, status: 'approved' })}
                      className="gap-1"
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateBusinessStatus.mutate({ id: biz.id, status: 'rejected' })}
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

          <TabsContent value="manage" className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              Manage approved businesses - add Editor's Pick images and main photos.
            </p>
            {approvedBusinesses?.length ? (
              approvedBusinesses.map(biz => (
                <div key={biz.id} className="card-elevated p-4">
                  <div className="flex items-center gap-3">
                    {biz.photos?.[0] && (
                      <img 
                        src={biz.photos[0]} 
                        alt={biz.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{biz.name}</h3>
                        {biz.featured && (
                          <Badge variant="secondary" className="gap-1">
                            <Star className="h-3 w-3" />
                            Featured
                          </Badge>
                        )}
                        {biz.editor_pick_image && (
                          <Badge variant="outline" className="gap-1">
                            <ImageIcon className="h-3 w-3" />
                            Editor's Pick
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {biz.category?.name} · {biz.neighborhood?.name}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog('business', biz)}
                        className="gap-1"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant={biz.featured ? "secondary" : "ghost"}
                        onClick={() => updateBusinessStatus.mutate({ id: biz.id, featured: !biz.featured })}
                        className="gap-1"
                      >
                        <Star className={`h-4 w-4 ${biz.featured ? 'fill-current' : ''}`} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No approved businesses yet</p>
            )}
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
