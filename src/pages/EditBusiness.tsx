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
import { ArrowLeft, Loader2 } from 'lucide-react';
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
