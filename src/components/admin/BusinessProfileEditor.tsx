import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
import { useCategories } from '@/hooks/useCategories';
import { useNeighborhoods } from '@/hooks/useNeighborhoods';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { SecureImage } from '@/components/ui/secure-image';
import { HoursEditor, BusinessHours, DEFAULT_BUSINESS_HOURS, parseBusinessHours } from '@/components/business/HoursEditor';
import { VISIT_LINK_OPTIONS } from '@/lib/visit-link';

interface BusinessProfileEditorProps {
  businessId: string;
}

export function BusinessProfileEditor({ businessId }: BusinessProfileEditorProps) {
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
    tiktok: '',
    facebook: '',
    address: '',
    visit_link_type: '',
    visit_link_url: '',
    story: '',
  });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [hours, setHours] = useState<BusinessHours>(DEFAULT_BUSINESS_HOURS);

  const { data: business, isLoading } = useQuery({
    queryKey: ['manage-business', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });

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
        tiktok: (business as Record<string, string>).tiktok || '',
        facebook: (business as Record<string, string>).facebook || '',
        address: business.address || '',
        visit_link_type: business.visit_link_type || '',
        visit_link_url: business.visit_link_url || '',
        story: business.story || '',
      });
      setLogoUrl(business.logo_url || null);
      setCoverUrl(business.cover_image_url || null);
      setHours(parseBusinessHours(business.hours));
    }
  }, [business]);

  const updateBusiness = useMutation({
    mutationFn: async () => {
      const normalizedWebsite = formData.website && !/^https?:\/\//i.test(formData.website)
        ? `https://${formData.website}`
        : formData.website;
      const updateData: Record<string, unknown> = {
        ...formData,
        website: normalizedWebsite,
        logo_url: logoUrl,
        cover_image_url: coverUrl,
        hours,
        visit_link_type: formData.visit_link_type || null,
        visit_link_url: formData.visit_link_url?.trim() || null,
      };

      const { error } = await supabase
        .from('businesses')
        .update(updateData)
        .eq('id', businessId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manage-business', businessId] });
      toast({ title: 'Profile saved' });
    },
    onError: (e: Error) => {
      toast({ variant: 'destructive', title: 'Could not save', description: e.message });
    },
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold tracking-tight">Business Profile</h2>
          <p className="text-sm text-muted-foreground">Edit your public listing information.</p>
        </div>
        <Button onClick={() => updateBusiness.mutate()} disabled={updateBusiness.isPending}>
          {updateBusiness.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Saving...</> : 'Save Changes'}
        </Button>
      </div>

      {/* Images */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Images</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Logo</Label>
            {logoUrl ? (
              <div className="relative">
                <SecureImage src={logoUrl} alt="Logo" className="w-20 h-20 rounded-xl object-cover border" />
                <button onClick={() => setLogoUrl(null)} className="absolute -top-1 -right-1 rounded-full bg-destructive text-white w-5 h-5 text-xs flex items-center justify-center">x</button>
              </div>
            ) : (
              <ImageUpload folder="logos" onUpload={setLogoUrl} />
            )}
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Cover Photo</Label>
            {coverUrl ? (
              <div className="relative">
                <SecureImage src={coverUrl} alt="Cover" className="w-full h-24 rounded-xl object-cover border" />
                <button onClick={() => setCoverUrl(null)} className="absolute -top-1 -right-1 rounded-full bg-destructive text-white w-5 h-5 text-xs flex items-center justify-center">x</button>
              </div>
            ) : (
              <ImageUpload folder="covers" onUpload={setCoverUrl} />
            )}
          </div>
        </div>
      </section>

      {/* Basics */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Basics</h3>
        <div className="space-y-3">
          <div>
            <Label htmlFor="name">Business Name</Label>
            <Input id="name" value={formData.name} onChange={(e) => updateField('name', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="description">Short Description</Label>
            <Textarea id="description" value={formData.description} onChange={(e) => updateField('description', e.target.value)} maxLength={160} rows={2} />
            <p className="text-xs text-muted-foreground mt-1">{formData.description.length}/160</p>
          </div>
          <div>
            <Label htmlFor="story">Story</Label>
            <Textarea id="story" value={formData.story} onChange={(e) => updateField('story', e.target.value)} rows={4} placeholder="Tell your story..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Select value={formData.category_id} onValueChange={(v) => updateField('category_id', v)}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {categories?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Neighborhood</Label>
              <Select value={formData.neighborhood_id} onValueChange={(v) => updateField('neighborhood_id', v)}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {neighborhoods?.map((n) => (
                    <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Contact & Links</h3>
        <div className="space-y-3">
          <div>
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={formData.address} onChange={(e) => updateField('address', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input id="website" type="text" value={formData.website} onChange={(e) => updateField('website', e.target.value)} placeholder="yourbusiness.com" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="instagram">Instagram</Label>
              <Input id="instagram" value={formData.instagram} onChange={(e) => updateField('instagram', e.target.value)} placeholder="@handle" />
            </div>
            <div>
              <Label htmlFor="tiktok">TikTok</Label>
              <Input id="tiktok" value={formData.tiktok} onChange={(e) => updateField('tiktok', e.target.value)} placeholder="@handle" />
            </div>
            <div>
              <Label htmlFor="facebook">Facebook</Label>
              <Input id="facebook" value={formData.facebook} onChange={(e) => updateField('facebook', e.target.value)} placeholder="Page URL" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Visit Button</Label>
              <Select value={formData.visit_link_type} onValueChange={(v) => updateField('visit_link_type', v)}>
                <SelectTrigger><SelectValue placeholder="Choose action..." /></SelectTrigger>
                <SelectContent>
                  {VISIT_LINK_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="visit_link_url">Visit URL</Label>
              <Input id="visit_link_url" value={formData.visit_link_url} onChange={(e) => updateField('visit_link_url', e.target.value)} placeholder="https://..." />
            </div>
          </div>
        </div>
      </section>

      {/* Hours */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Hours</h3>
        <HoursEditor hours={hours} onChange={setHours} />
      </section>

      <div className="pt-4 border-t">
        <Button onClick={() => updateBusiness.mutate()} disabled={updateBusiness.isPending} className="w-full sm:w-auto">
          {updateBusiness.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
