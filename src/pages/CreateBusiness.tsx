import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { ArrowLeft } from 'lucide-react';

export default function CreateBusiness() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: categories } = useCategories();
  const { data: neighborhoods } = useNeighborhoods();

  const createBusiness = useMutation({
    mutationFn: async (formData: {
      name: string;
      description: string;
      category_id: string;
      neighborhood_id: string;
      phone?: string;
      website?: string;
      instagram?: string;
      address?: string;
    }) => {
      if (!user) throw new Error('Must be logged in');
      
      const { error } = await supabase.from('businesses').insert({
        ...formData,
        owner_user_id: user.id,
        status: 'pending',
      });
      
      if (error) throw error;
      
      // Add business role to user
      await supabase.from('user_roles').insert({
        user_id: user.id,
        role: 'business',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-business'] });
      toast({ 
        title: 'Business submitted!',
        description: 'Your listing is pending approval.',
      });
      navigate('/profile');
    },
    onError: (error) => {
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: error.message 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createBusiness.mutate({
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      category_id: formData.get('category_id') as string,
      neighborhood_id: formData.get('neighborhood_id') as string,
      phone: formData.get('phone') as string || undefined,
      website: formData.get('website') as string || undefined,
      instagram: formData.get('instagram') as string || undefined,
      address: formData.get('address') as string || undefined,
    });
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <>
      <Header title="List Your Business" />
      
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Business Name *</Label>
            <Input 
              id="name" 
              name="name" 
              placeholder="Your business name"
              required 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select name="category_id" required>
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
              <Select name="neighborhood_id" required>
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
              name="description" 
              placeholder="Tell people about your business..."
              rows={4}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input 
              id="address" 
              name="address" 
              placeholder="123 Main St, Toledo, OH"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input 
              id="phone" 
              name="phone" 
              type="tel"
              placeholder="(419) 555-0123"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input 
              id="website" 
              name="website" 
              type="url"
              placeholder="https://yourbusiness.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram Handle</Label>
            <Input 
              id="instagram" 
              name="instagram" 
              placeholder="@yourbusiness"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={createBusiness.isPending}
          >
            {createBusiness.isPending ? 'Submitting...' : 'Submit for Approval'}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            Your listing will be reviewed before going live.
          </p>
        </form>
      </PageContainer>
    </>
  );
}
