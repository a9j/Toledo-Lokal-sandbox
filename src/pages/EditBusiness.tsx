import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/hooks/useCategories';
import { useNeighborhoods } from '@/hooks/useNeighborhoods';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Infinity, Crown } from 'lucide-react';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { SecureImage } from '@/components/ui/secure-image';

export default function EditBusiness() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: categories } = useCategories();
  const { data: neighborhoods } = useNeighborhoods();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    neighborhood_id: '',
    phone: '',
    website: '',
    instagram: '',
    address: '',
  });
  const [mainPhoto, setMainPhoto] = useState<string | null>(null);
  const [isInLoop, setIsInLoop] = useState(false);

  const { data: business, isLoading } = useQuery({
    queryKey: ['edit-business', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch loop settings for this business
  const { data: loopSettings } = useQuery({
    queryKey: ['business-loop-settings-edit', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('business_loop_settings')
        .select('*')
        .eq('business_id', id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!id,
  });

  // Check if user owns this business
  useEffect(() => {
    if (business && user && business.owner_user_id !== user.id) {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'You can only edit your own business.',
      });
      navigate('/dashboard');
    }
  }, [business, user, navigate, toast]);

  // Populate form when business data loads
  useEffect(() => {
    if (business) {
      setFormData({
        name: business.name || '',
        description: business.description || '',
        category_id: business.category_id || '',
        neighborhood_id: business.neighborhood_id || '',
        phone: business.phone || '',
        website: business.website || '',
        instagram: business.instagram || '',
        address: business.address || '',
      });
      setMainPhoto(business.photos?.[0] || null);
    }
  }, [business]);

  // Populate loop settings
  useEffect(() => {
    if (loopSettings) {
      setIsInLoop(loopSettings.is_active || false);
    }
  }, [loopSettings]);

  const updateBusiness = useMutation({
    mutationFn: async (data: typeof formData & { photos?: string[] }) => {
      if (!id) throw new Error('No business ID');
      
      const updateData: any = { ...data };
      
      // Handle photos array
      if (mainPhoto) {
        const existingPhotos = business?.photos || [];
        // Put new main photo first, keep others
        updateData.photos = [mainPhoto, ...existingPhotos.filter(p => p !== mainPhoto)];
      }
      
      const { error } = await supabase
        .from('businesses')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['edit-business', id] });
      queryClient.invalidateQueries({ queryKey: ['user-business'] });
      queryClient.invalidateQueries({ queryKey: ['user-business-full'] });
      toast({ 
        title: 'Business updated!',
        description: 'Your changes have been saved.',
      });
      navigate('/dashboard');
    },
    onError: (error) => {
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: error.message 
      });
    },
  });

  const updateLoopSettings = useMutation({
    mutationFn: async (active: boolean) => {
      if (!id) throw new Error('No business ID');
      
      // Check if settings exist
      if (loopSettings) {
        const { error } = await supabase
          .from('business_loop_settings')
          .update({ is_active: active })
          .eq('business_id', id);
        
        if (error) throw error;
      } else {
        // Create settings if they don't exist
        const { error } = await supabase
          .from('business_loop_settings')
          .insert({
            business_id: id,
            loop_tier_id: 'visible_only',
            is_active: active,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-loop-settings-edit', id] });
      toast({ 
        title: isInLoop ? 'Joined the Loop!' : 'Left the Loop',
        description: isInLoop ? 'Your business is now visible in Loop.' : 'Your business is no longer in Loop.',
      });
    },
    onError: (error) => {
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: error.message 
      });
      // Revert the toggle
      setIsInLoop(!isInLoop);
    },
  });

  const handleLoopToggle = (checked: boolean) => {
    setIsInLoop(checked);
    updateLoopSettings.mutate(checked);
  };

  const isFoundingMember = loopSettings?.is_founding_member || false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusiness.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (isLoading) {
    return (
      <>
        <Header title="Edit Business" />
        <PageContainer className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </PageContainer>
      </>
    );
  }

  if (!business) {
    return (
      <>
        <Header title="Edit Business" />
        <PageContainer>
          <p className="text-center text-muted-foreground">Business not found</p>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header title="Edit Business" />
      
      <PageContainer className="pb-20">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-4 -ml-2"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Button>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Founding Member Badge */}
          {isFoundingMember && (
            <div className="card-elevated p-4 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-500/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-amber-600 dark:text-amber-400">Founding 5 Member</h3>
                    <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0">
                      1 of 6
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    All Loop Partner benefits free for life. Thank you for believing in Toledo!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Loop Participation Toggle */}
          <div className="card-elevated p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Infinity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <Label className="text-base font-medium">Participate in Loop</Label>
                  <p className="text-sm text-muted-foreground">
                    Show your business as "in the loop" to customers
                  </p>
                </div>
              </div>
              <Switch
                checked={isInLoop}
                onCheckedChange={handleLoopToggle}
                disabled={updateLoopSettings.isPending}
              />
            </div>
            {isInLoop && (
              <p className="text-xs text-muted-foreground bg-secondary/50 p-2 rounded-lg">
                Your business will appear with the Loop badge and customers can earn/redeem points with you.
              </p>
            )}
          </div>

          {/* Main Photo Upload */}
          <div className="space-y-2">
            <Label>Main Photo (shown in feed)</Label>
            <p className="text-sm text-muted-foreground mb-2">
              This image will be displayed when your business appears in listings and search results.
            </p>
            {mainPhoto ? (
              <div className="space-y-2">
                <SecureImage
                  src={mainPhoto}
                  alt="Business main photo"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setMainPhoto(null)}
                >
                  Remove Photo
                </Button>
              </div>
            ) : (
              <ImageUpload
                onUpload={(url) => setMainPhoto(url)}
                folder="businesses"
                label="Upload Main Photo"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Business Name *</Label>
            <Input 
              id="name" 
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Your business name"
              required 
              maxLength={200}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select 
                value={formData.category_id} 
                onValueChange={(value) => handleInputChange('category_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Neighborhood *</Label>
              <Select 
                value={formData.neighborhood_id}
                onValueChange={(value) => handleInputChange('neighborhood_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {neighborhoods?.map(n => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea 
              id="description" 
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Tell people about your business..."
              rows={4}
              required
              maxLength={5000}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input 
              id="address" 
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="123 Main St, Toledo, OH"
              maxLength={500}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input 
              id="phone" 
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              type="tel"
              placeholder="(419) 555-0123"
              maxLength={50}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input 
              id="website" 
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              type="url"
              placeholder="https://yourbusiness.com"
              maxLength={500}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram Handle</Label>
            <Input 
              id="instagram" 
              value={formData.instagram}
              onChange={(e) => handleInputChange('instagram', e.target.value)}
              placeholder="@yourbusiness"
              maxLength={100}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={updateBusiness.isPending}
          >
            {updateBusiness.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </PageContainer>
    </>
  );
}
