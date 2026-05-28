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
import { ArrowLeft, Loader2, Infinity, Crown, Instagram } from 'lucide-react';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { SecureImage } from '@/components/ui/secure-image';
import { HoursEditor, BusinessHours, DEFAULT_BUSINESS_HOURS, parseBusinessHours } from '@/components/business/HoursEditor';
import { VISIT_LINK_OPTIONS } from '@/lib/visit-link';
import {
  BUSINESS_CATEGORY_OPTIONS,
  BusinessCategory,
  ProfileModuleContent,
  ModuleFieldValue,
  PROFILE_SECTION_LABELS,
  getModulesForCategory,
  parseModuleContent,
} from '@/lib/profile-modules';

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
    tiktok: '',
    facebook: '',
    address: '',
    visit_link_type: '',
    visit_link_url: '',
    category: 'restaurant',
  });
  const [mainPhoto, setMainPhoto] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [hours, setHours] = useState<BusinessHours>(DEFAULT_BUSINESS_HOURS);
  const [isInLoop, setIsInLoop] = useState(false);
  const [moduleContent, setModuleContent] = useState<ProfileModuleContent>({});

  const setModuleField = (moduleId: string, key: string, value: string) => {
    setModuleContent((prev) => ({ ...prev, [moduleId]: { ...prev[moduleId], [key]: value } }));
  };

  const getModuleText = (moduleId: string, key: string): string => {
    const v = moduleContent[moduleId]?.[key];
    return typeof v === 'string' ? v : '';
  };

  const getModuleImages = (moduleId: string, key: string): string[] => {
    const v = moduleContent[moduleId]?.[key];
    return Array.isArray(v) ? v : [];
  };

  const setModuleImages = (moduleId: string, key: string, value: string[]) => {
    setModuleContent((prev) => ({ ...prev, [moduleId]: { ...prev[moduleId], [key]: value } }));
  };

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

  // Determine whether the user manages this business (business_staff role='manager').
  // Owners are handled separately below.
  const { data: isManager } = useQuery({
    queryKey: ['edit-business-is-manager', id, user?.id],
    queryFn: async () => {
      if (!id || !user) return false;
      const { data } = await supabase
        .from('business_staff')
        .select('id')
        .eq('business_id', id)
        .eq('user_id', user.id)
        .eq('role', 'manager')
        .maybeSingle();
      return !!data;
    },
    enabled: !!id && !!user,
  });

  // Access guard: owners and managers can edit; anyone else is redirected.
  // Wait until the manager check has settled before denying.
  useEffect(() => {
    if (!business || !user || isManager === undefined) return;
    const isOwner = business.owner_user_id === user.id;
    if (!isOwner && !isManager) {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'You can only edit a business you own or manage.',
      });
      navigate('/dashboard');
    }
  }, [business, user, isManager, navigate, toast]);

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
        tiktok: (business as any).tiktok || '',
        facebook: (business as any).facebook || '',
        address: business.address || '',
        visit_link_type: business.visit_link_type || '',
        visit_link_url: business.visit_link_url || '',
        category: business.category || 'restaurant',
      });
      setModuleContent(parseModuleContent(business.profile_modules));
      setMainPhoto(business.photos?.[0] || null);
      setLogoUrl(business.logo_url || null);
      setHours(parseBusinessHours(business.hours));
    }
  }, [business]);

  // Populate loop settings
  useEffect(() => {
    if (loopSettings) {
      setIsInLoop(loopSettings.is_active || false);
    }
  }, [loopSettings]);

  const updateBusiness = useMutation({
    mutationFn: async (data: typeof formData & { photos?: string[]; logo_url?: string | null }) => {
      if (!id) throw new Error('No business ID');
      
      const updateData: any = { ...data };
      
      // Handle photos array
      if (mainPhoto) {
        const existingPhotos = business?.photos || [];
        // Put new main photo first, keep others
        updateData.photos = [mainPhoto, ...existingPhotos.filter(p => p !== mainPhoto)];
      }
      
      // Handle logo
      updateData.logo_url = logoUrl;
      
      // Handle hours
      updateData.hours = hours;

      // Empty enum / url => null (empty string is not a valid visit_link_type)
      updateData.visit_link_type = data.visit_link_type || null;
      updateData.visit_link_url = data.visit_link_url?.trim() || null;

      // Flexible profile system: category enum + module content. Prune empty
      // fields/modules so we don't store blanks.
      updateData.category = data.category || 'restaurant';
      const prunedModules: ProfileModuleContent = {};
      for (const [moduleId, fields] of Object.entries(moduleContent)) {
        const kept: Record<string, ModuleFieldValue> = {};
        for (const [k, v] of Object.entries(fields)) {
          if (Array.isArray(v)) {
            if (v.length) kept[k] = v;
          } else if (typeof v === 'string' && v.trim()) {
            kept[k] = v.trim();
          }
        }
        if (Object.keys(kept).length) prunedModules[moduleId] = kept;
      }
      updateData.profile_modules = prunedModules;

      let { error } = await supabase
        .from('businesses')
        .update(updateData)
        .eq('id', id);

      // visit_link_*, category and profile_modules ship in migrations that may
      // not be applied yet. If so, retry without them so other edits still save.
      if (error && /(visit_link|profile_modules|column .*category)/i.test(error.message ?? '')) {
        const { visit_link_type, visit_link_url, category, profile_modules, ...rest } = updateData;
        ({ error } = await supabase.from('businesses').update(rest).eq('id', id));
      }

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['edit-business', id] });
      queryClient.invalidateQueries({ queryKey: ['user-business'] });
      queryClient.invalidateQueries({ queryKey: ['user-business-full'] });
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      toast({ 
        title: 'Business updated!',
        description: 'Your changes have been saved.',
      });
      navigate('/dashboard');
    },
    onError: () => {
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: 'Failed to update business. Please try again.' 
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
            loop_tier_id: 'community',
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
    onError: () => {
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: 'Failed to update Loop settings. Please try again.' 
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
      
      <PageContainer className="pb-32">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-4 -ml-2"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Button>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Founding Member Badge - Compact */}
          {isFoundingMember && (
            <div className="card-elevated p-3 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-500/30">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center flex-shrink-0">
                  <Crown className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-amber-600 dark:text-amber-400">Founding 5</span>
                    <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 text-xs px-1.5 py-0">
                      1 of 6
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    All Loop benefits free for life
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Loop Participation Toggle - Compact */}
          <div className={`card-elevated p-3 ${isInLoop ? 'border-primary/30 bg-primary/5' : 'border-muted bg-muted/30'}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isInLoop ? 'bg-primary/20' : 'bg-muted'}`}>
                  <Infinity className={`h-4 w-4 ${isInLoop ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${isInLoop ? '' : 'text-muted-foreground'}`}>
                      {isInLoop ? 'In the Loop' : 'Out of the Loop'}
                    </span>
                    {isInLoop && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-primary/20 text-primary">
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isInLoop ? 'Customers can earn & redeem points' : 'Toggle on to join Loop'}
                  </p>
                </div>
              </div>
              <Switch
                checked={isInLoop}
                onCheckedChange={handleLoopToggle}
                disabled={updateLoopSettings.isPending}
              />
            </div>
          </div>

          {/* Images Section - Two Side by Side */}
          <div className="grid grid-cols-2 gap-4">
            {/* Logo */}
            <div className="card-elevated p-3 space-y-2">
              <Label className="text-sm font-medium">Logo</Label>
              {logoUrl ? (
                <div className="relative">
                  <SecureImage
                    storagePath={logoUrl}
                    alt="Business logo"
                    className="w-full aspect-square object-contain rounded-lg border border-border bg-muted/30"
                  />
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => setLogoUrl(null)}
                  >
                    <span className="sr-only">Remove</span>×
                  </Button>
                </div>
              ) : (
                <ImageUpload
                  onUpload={(url) => setLogoUrl(url)}
                  folder="businesses/logos"
                  label="Upload"
                />
              )}
            </div>

            {/* Feed Photo */}
            <div className="card-elevated p-3 space-y-2">
              <Label className="text-sm font-medium">Feed Photo</Label>
              {mainPhoto ? (
                <div className="relative">
                  <SecureImage
                    storagePath={mainPhoto}
                    alt="Feed photo"
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                  <Button
                    type="button" 
                    variant="destructive" 
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => setMainPhoto(null)}
                  >
                    <span className="sr-only">Remove</span>×
                  </Button>
                </div>
              ) : (
                <ImageUpload
                  onUpload={(url) => setMainPhoto(url)}
                  folder="businesses"
                  label="Upload"
                />
              )}
            </div>
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
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select 
                value={formData.category_id} 
                onValueChange={(value) => handleInputChange('category_id', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
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
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select area" />
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
          
          {/* Social Links */}
          <div className="card-elevated p-4 space-y-3">
            <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Social Links</Label>
            
            <div className="space-y-2">
              <Label htmlFor="instagram" className="flex items-center gap-2">
                <Instagram className="h-4 w-4 text-[#E4405F]" />
                Instagram
              </Label>
              <Input 
                id="instagram" 
                value={formData.instagram}
                onChange={(e) => handleInputChange('instagram', e.target.value)}
                placeholder="@yourbusiness"
                maxLength={100}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tiktok" className="flex items-center gap-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
                TikTok
              </Label>
              <Input 
                id="tiktok" 
                value={formData.tiktok}
                onChange={(e) => handleInputChange('tiktok', e.target.value)}
                placeholder="@yourbusiness"
                maxLength={100}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="facebook" className="flex items-center gap-2">
                <svg className="h-4 w-4 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </Label>
              <Input 
                id="facebook" 
                value={formData.facebook}
                onChange={(e) => handleInputChange('facebook', e.target.value)}
                placeholder="YourBusinessPage"
                maxLength={100}
              />
            </div>
          </div>
          
          {/* Visit Button */}
          <div className="card-elevated p-4 space-y-3">
            <div>
              <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Visit Button</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Choose where your profile's Visit button sends people. Leave as default to use your website.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="visit_link_type">Button action</Label>
              <Select
                value={formData.visit_link_type || 'default'}
                onValueChange={(value) => handleInputChange('visit_link_type', value === 'default' ? '' : value)}
              >
                <SelectTrigger id="visit_link_type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default (use website)</SelectItem>
                  {VISIT_LINK_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="visit_link_url">
                {formData.visit_link_type === 'phone' ? 'Phone number' : 'Link URL'}
              </Label>
              <Input
                id="visit_link_url"
                value={formData.visit_link_url}
                onChange={(e) => handleInputChange('visit_link_url', e.target.value)}
                type={formData.visit_link_type === 'phone' ? 'tel' : 'url'}
                placeholder={
                  formData.visit_link_type === 'phone'
                    ? '(419) 555-0123 — or leave blank to use phone above'
                    : formData.visit_link_type === 'google_maps'
                    ? 'Maps link, or leave blank to use the address above'
                    : 'https://...'
                }
                maxLength={500}
              />
            </div>
          </div>

          {/* Business Category */}
          <div className="card-elevated p-4 space-y-3">
            <div>
              <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Business Category</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Controls which content sections appear on your public profile.
              </p>
            </div>
            <Select
              value={formData.category || 'restaurant'}
              onValueChange={(v) => handleInputChange('category', v)}
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {BUSINESS_CATEGORY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Profile Content (category-specific modules) */}
          <div className="card-elevated p-4 space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Profile Content</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Fill in what's relevant. Anything left blank is hidden on your profile.
              </p>
            </div>
            {getModulesForCategory((formData.category || 'restaurant') as BusinessCategory).map((module) => (
              <div key={module.id} className="space-y-2 border-t border-border/50 pt-4 first:border-t-0 first:pt-0">
                <p className="text-sm font-medium">
                  {module.title}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">· {PROFILE_SECTION_LABELS[module.section]}</span>
                </p>
                {module.fields.map((field) => (
                  <div key={field.key} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{field.label}</Label>
                    {field.type === 'images' ? (
                      <div className="space-y-2">
                        {getModuleImages(module.id, field.key).length > 0 && (
                          <div className="grid grid-cols-3 gap-2">
                            {getModuleImages(module.id, field.key).map((path, i) => (
                              <div key={`${path}-${i}`} className="relative">
                                <SecureImage storagePath={path} alt={`${field.label} ${i + 1}`} className="aspect-square w-full rounded-lg object-cover" />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute right-1 top-1 h-6 w-6"
                                  onClick={() => setModuleImages(module.id, field.key, getModuleImages(module.id, field.key).filter((_, idx) => idx !== i))}
                                >
                                  <span className="sr-only">Remove</span>×
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        <ImageUpload
                          folder="businesses/modules"
                          label="Add photo"
                          onUpload={(url) => setModuleImages(module.id, field.key, [...getModuleImages(module.id, field.key), url])}
                        />
                      </div>
                    ) : field.type === 'textarea' ? (
                      <Textarea
                        value={getModuleText(module.id, field.key)}
                        onChange={(e) => setModuleField(module.id, field.key, e.target.value)}
                        placeholder={field.placeholder}
                        rows={3}
                        maxLength={2000}
                      />
                    ) : (
                      <Input
                        type={field.type === 'url' ? 'url' : field.type === 'tel' ? 'tel' : field.type === 'date' ? 'date' : field.type === 'time' ? 'time' : 'text'}
                        value={getModuleText(module.id, field.key)}
                        onChange={(e) => setModuleField(module.id, field.key, e.target.value)}
                        placeholder={field.placeholder}
                        maxLength={500}
                      />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Hours of Operation */}
          <div className="card-elevated p-4">
            <HoursEditor hours={hours} onChange={setHours} />
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
