import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/hooks/useCategories';

import { useSaveBusinessLocations, BusinessLocation, DEFAULT_LOCATION, NEIGHBORHOOD_OPTIONS } from '@/hooks/useBusinessLocations';
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
import { ImageCropUpload } from '@/components/business/ImageCropUpload';
import { TierBadge } from '@/components/business/TierBadge';
import { toast } from 'sonner';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  MapPin,
  Camera,
  Clock,
  PartyPopper,
  Instagram,
  Copy,
  AlertTriangle,
  Plus,
  X,
  Star,
  Check,
} from 'lucide-react';
import { isFreeEmailProvider } from '@/lib/email-utils';
import { inferPreset, buildPresetBlocks } from '@/lib/profile-blocks';

interface OnboardingData {
  name: string;
  category_id: string;
  description: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  neighborhood_id: string;
  profile_picture_url: string;
  cover_image_url: string;
  hours: Record<string, { open: string; close: string; closed: boolean }>;
  email: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  /** Onboarding's one question — drives the profile block preset. */
  movesAround: boolean;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DEFAULT_HOURS = DAYS.reduce((acc, day) => {
  acc[day] = { open: '09:00', close: '17:00', closed: false };
  return acc;
}, {} as Record<string, { open: string; close: string; closed: boolean }>);

const STEPS = [
  { icon: Sparkles, title: 'Basics' },
  { icon: MapPin, title: 'Location' },
  { icon: Camera, title: 'Look' },
  { icon: Clock, title: 'Hours' },
  { icon: PartyPopper, title: 'Done!' },
];

export default function BusinessOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: categories } = useCategories();
  

  const [step, setStep] = useState(1);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [tierStatus, setTierStatus] = useState<string>('community');
  const [tierAssignedAt, setTierAssignedAt] = useState<string | null>(null);
  const [data, setData] = useState<OnboardingData>({
    name: '',
    category_id: '',
    description: '',
    phone: '',
    website: '',
    address: '',
    city: 'Toledo',
    state: 'OH',
    zip: '',
    neighborhood_id: '',
    profile_picture_url: '',
    cover_image_url: '',
    hours: DEFAULT_HOURS,
    email: '',
    instagram: '',
    facebook: '',
    tiktok: '',
    movesAround: false,
  });
  const [charCount, setCharCount] = useState(0);
  const [locations, setLocations] = useState<BusinessLocation[]>([
    { ...DEFAULT_LOCATION, is_primary: true },
  ]);
  const saveLocationsMutation = useSaveBusinessLocations(businessId);

  // Check if user already has a business with incomplete onboarding
  useEffect(() => {
    if (!user) return;
    const loadExisting = async () => {
      const { data: biz } = await supabase
        .from('businesses')
        .select('id, name, description, phone, website, address, category_id, neighborhood_id, profile_picture_url, cover_image_url, hours, instagram, facebook, tiktok, onboarding_step, tier_status, tier_assigned_at')
        .eq('owner_user_id', user.id)
        .eq('onboarding_completed', false)
        .maybeSingle();

      if (biz) {
        setBusinessId(biz.id);
        setStep(biz.onboarding_step || 1);
        setTierStatus(biz.tier_status || 'community');
        setTierAssignedAt(biz.tier_assigned_at);
        setData(prev => ({
          ...prev,
          name: biz.name || '',
          description: biz.description || '',
          phone: biz.phone || '',
          website: biz.website || '',
          address: biz.address || '',
          category_id: biz.category_id || '',
          neighborhood_id: biz.neighborhood_id || '',
          profile_picture_url: biz.profile_picture_url || '',
          cover_image_url: biz.cover_image_url || '',
          instagram: biz.instagram || '',
          facebook: biz.facebook || '',
          tiktok: biz.tiktok || '',
          hours: (biz.hours as OnboardingData['hours']) || DEFAULT_HOURS,
        }));
      }
    };
    loadExisting();
  }, [user]);

  const updateField = (field: keyof OnboardingData, value: OnboardingData[keyof OnboardingData]) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const saveProgress = useMutation({
    mutationFn: async (nextStep: number) => {
      if (!user) throw new Error('Not authenticated');

      // Use primary location address for backwards compat
      const primary = locations.find(l => l.is_primary) || locations[0];
      const fullAddress = primary?.street_address
        ? `${primary.street_address}, ${primary.city}, ${primary.state} ${primary.zip_code}`.trim()
        : (data.address ? `${data.address}, ${data.city}, ${data.state} ${data.zip}`.trim() : '');

      const payload: Record<string, string | boolean | null | OnboardingData['hours']> = {
        name: data.name,
        description: data.description,
        category_id: data.category_id || null,
        neighborhood_id: data.neighborhood_id || null,
        phone: primary?.phone || data.phone || null,
        website: data.website ? (!/^https?:\/\//i.test(data.website) ? `https://${data.website}` : data.website) : null,
        address: fullAddress || null,
        instagram: data.instagram || null,
        facebook: data.facebook || null,
        tiktok: data.tiktok || null,
        profile_picture_url: data.profile_picture_url || null,
        cover_image_url: data.cover_image_url || null,
        hours: data.hours,
        onboarding_step: nextStep,
        owner_user_id: user.id,
        status: 'pending',
      };

      if (nextStep > 5) {
        payload.onboarding_completed = true;
        payload.onboarding_completed_at = new Date().toISOString();
      }

      let currentBusinessId = businessId;

      if (currentBusinessId) {
        const { error } = await supabase
          .from('businesses')
          .update(payload)
          .eq('id', currentBusinessId);
        if (error) throw error;
      } else {
        const { data: newBiz, error } = await supabase
          .from('businesses')
          .insert(payload)
          .select('id')
          .single();
        if (error) throw error;
        currentBusinessId = newBiz.id;
        setBusinessId(newBiz.id);

        // Add business role
        try {
          const { error: roleError } = await supabase.from('user_roles').insert({
            user_id: user.id,
            role: 'business',
          });
          if (roleError && !roleError.message.includes('duplicate')) throw roleError;
        } catch (err) {
          // Role may already exist — only swallow genuine duplicates
          console.error('Failed to insert user role:', err);
        }
      }

      // Save locations when leaving step 2
      if (nextStep > 2 && currentBusinessId && locations.some(l => l.street_address.trim())) {
        const rows = locations.filter(l => l.street_address.trim()).map(loc => ({
          business_id: currentBusinessId!,
          label: loc.label || null,
          street_address: loc.street_address,
          city: loc.city,
          state: loc.state,
          zip_code: loc.zip_code,
          neighborhood: loc.neighborhood || null,
          phone: loc.phone || null,
          hours: loc.hours,
          is_primary: loc.is_primary,
          is_active: loc.is_active,
        }));

        // Delete existing and re-insert
        const { error: deleteError } = await supabase.from('business_locations').delete().eq('business_id', currentBusinessId);
        if (deleteError) throw deleteError;
        if (rows.length > 0) {
          const { error: insertError } = await supabase.from('business_locations').insert(rows);
          if (insertError) throw insertError;
        }
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    },
  });

  const goNext = async () => {
    if (step === 1 && !data.name.trim()) {
      toast.error('Business name is required');
      return;
    }
    const next = step + 1;
    await saveProgress.mutateAsync(next);
    setStep(next);
  };

  const goBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = async () => {
    await saveProgress.mutateAsync(6);
    await seedProfileBlocks();
    queryClient.invalidateQueries({ queryKey: ['user-business'] });
    toast.success('Welcome to Toledo Lokal!');
    navigate('/dashboard');
  };

  // Seed the profile block layout from a preset inferred from the business's
  // category + the one onboarding question (fixed vs. moving). Only seeds when
  // no blocks exist yet, so re-running onboarding never clobbers an owner's
  // customized layout.
  const seedProfileBlocks = async () => {
    if (!businessId) return;
    try {
      const { count } = await supabase
        .from('profile_blocks')
        .select('block_type', { count: 'exact', head: true })
        .eq('business_id', businessId);
      if (count && count > 0) return;

      const categoryName = categories?.find((c) => c.id === data.category_id)?.name ?? null;
      const presetId = inferPreset({ categoryName, movesAround: data.movesAround });
      const rows = buildPresetBlocks(presetId).map((b) => ({ ...b, business_id: businessId }));
      const { error: insertError } = await supabase.from('profile_blocks').insert(rows);
      if (insertError) throw insertError;
    } catch (err) {
      // Non-fatal: the owner can still pick a layout from the profile editor.
      console.error('Failed to seed profile blocks:', err);
    }
  };

  const copyHoursToWeekdays = () => {
    const monday = data.hours.monday;
    if (!monday) return;
    const updated = { ...data.hours };
    ['tuesday', 'wednesday', 'thursday', 'friday'].forEach(day => {
      updated[day] = { ...monday };
    });
    updateField('hours', updated);
    toast.success('Copied to weekdays');
  };

  const copyHoursToWeekend = () => {
    const saturday = data.hours.saturday;
    if (!saturday) return;
    const updated = { ...data.hours };
    updated.sunday = { ...saturday };
    updateField('hours', updated);
    toast.success('Copied to Sunday');
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full h-1 rounded-full transition-colors ${
                    i + 1 <= step ? 'bg-primary' : 'bg-border'
                  }`}
                />
                <span className={`text-[10px] font-medium ${
                  i + 1 <= step ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {s.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-20 pb-32">
        {/* Step 1: Welcome & Basics */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in-up">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
                <Sparkles className="h-7 w-7 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold mb-1">Welcome to Toledo Lokal!</h1>
              <p className="text-muted-foreground text-sm">Let's get your business set up. This takes about 5 minutes. You can always update everything later.</p>
            </div>

            {user?.email && isFreeEmailProvider(user.email) && (
              <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    You're using a personal email ({user.email})
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    Business listings from personal email accounts require admin approval before going live. For faster approval, use a business email.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>What type of business are you? *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => updateField('movesAround', false)}
                    className={`rounded-xl border p-3 text-left text-sm transition-colors ${
                      !data.movesAround
                        ? 'border-primary bg-primary/5 font-medium text-foreground'
                        : 'border-border text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    <span className="block font-semibold">Fixed location</span>
                    <span className="text-xs">Customers come to my address</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('movesAround', true)}
                    className={`rounded-xl border p-3 text-left text-sm transition-colors ${
                      data.movesAround
                        ? 'border-primary bg-primary/5 font-medium text-foreground'
                        : 'border-border text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    <span className="block font-semibold">I move around</span>
                    <span className="text-xs">Food truck, pop-up, or vendor</span>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  This sets up the right profile layout for you. You can change it later.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Business Name *</Label>
                <Input
                  id="name"
                  value={data.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Your business name"
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={data.category_id} onValueChange={(v) => updateField('category_id', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="desc">
                  Short Description *
                  <span className="text-muted-foreground text-xs ml-2">{charCount}/160</span>
                </Label>
                <Textarea
                  id="desc"
                  value={data.description}
                  onChange={(e) => {
                    const val = e.target.value.slice(0, 160);
                    updateField('description', val);
                    setCharCount(val.length);
                  }}
                  placeholder="What makes your business special? This shows up in search results."
                  maxLength={160}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={data.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="(419) 555-0123" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" value={data.website} onChange={(e) => updateField('website', e.target.value)} placeholder="yourbusiness.com" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in-up">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-lokal-forest to-lokal-forest-light flex items-center justify-center mb-4">
                <MapPin className="h-7 w-7 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold mb-1">Where can people find you?</h1>
            </div>

            <div className="space-y-4">
              {locations.map((loc, i) => (
                <div key={i} className="rounded-xl border border-border p-4 space-y-4 relative">
                  {/* Location header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-muted-foreground">
                        Location {i + 1}
                      </span>
                      {loc.is_primary && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px] gap-1">
                          <Star className="h-3 w-3" /> Primary
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {!loc.is_primary && locations.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-xs text-muted-foreground h-7"
                          onClick={() => setLocations(locations.map((l, j) => ({ ...l, is_primary: j === i })))}
                        >
                          Set as primary
                        </Button>
                      )}
                      {!loc.is_primary && locations.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => setLocations(locations.filter((_, j) => j !== i))}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Nickname for additional locations */}
                  {(locations.length > 1 || i > 0) && (
                    <div className="space-y-1">
                      <Label className="text-sm">Location nickname</Label>
                      <Input
                        value={loc.label}
                        onChange={(e) => {
                          const next = [...locations];
                          next[i] = { ...loc, label: e.target.value };
                          setLocations(next);
                        }}
                        placeholder="e.g. Downtown, Perrysburg, West Side"
                        className="h-9"
                      />
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-sm">Street Address *</Label>
                      <Input
                        value={loc.street_address}
                        onChange={(e) => {
                          const next = [...locations];
                          next[i] = { ...loc, street_address: e.target.value };
                          setLocations(next);
                        }}
                        placeholder="123 Main St"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-sm">City</Label>
                        <Input
                          value={loc.city}
                          onChange={(e) => {
                            const next = [...locations];
                            next[i] = { ...loc, city: e.target.value };
                            setLocations(next);
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm">State</Label>
                        <Input
                          value={loc.state}
                          onChange={(e) => {
                            const next = [...locations];
                            next[i] = { ...loc, state: e.target.value };
                            setLocations(next);
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm">ZIP *</Label>
                        <Input
                          value={loc.zip_code}
                          onChange={(e) => {
                            const next = [...locations];
                            next[i] = { ...loc, zip_code: e.target.value };
                            setLocations(next);
                          }}
                          placeholder="43604"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-sm">Neighborhood</Label>
                      <Select
                        value={loc.neighborhood}
                        onValueChange={(v) => {
                          const next = [...locations];
                          next[i] = { ...loc, neighborhood: v };
                          setLocations(next);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {NEIGHBORHOOD_OPTIONS.map(n => (
                            <SelectItem key={n} value={n}>{n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-sm">Phone (this location)</Label>
                      <Input
                        value={loc.phone}
                        onChange={(e) => {
                          const next = [...locations];
                          next[i] = { ...loc, phone: e.target.value };
                          setLocations(next);
                        }}
                        placeholder="(419) 555-0123"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {locations.length < 10 && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 text-muted-foreground"
                  onClick={() => setLocations([...locations, { ...DEFAULT_LOCATION }])}
                >
                  <Plus className="h-4 w-4" /> Add another location
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Your Look */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in-up">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-lokal-terracotta to-lokal-terracotta-light flex items-center justify-center mb-4">
                <Camera className="h-7 w-7 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold mb-1">Make your profile stand out</h1>
              <p className="text-muted-foreground text-sm">Upload your logo and a cover photo. Don't worry about sizing, we handle that automatically.</p>
              <a
                href="/business-image-guide"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                See the image guide
              </a>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Profile Picture / Logo</Label>
                <p className="text-xs text-muted-foreground">Your logo or a photo that represents your business</p>
                <div className="flex justify-center">
                  <ImageCropUpload
                    aspectRatio={1}
                    shape="circle"
                    maxFileSize={5}
                    outputWidth={800}
                    outputHeight={800}
                    onUploadComplete={(url) => updateField('profile_picture_url', url)}
                    placeholder="Upload logo"
                    currentImageUrl={data.profile_picture_url || null}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Cover Image</Label>
                <p className="text-xs text-muted-foreground">A banner for the top of your profile — storefront, products, team, etc.</p>
                <ImageCropUpload
                  aspectRatio={3}
                  shape="rectangle"
                  maxFileSize={10}
                  outputWidth={2400}
                  outputHeight={800}
                  onUploadComplete={(url) => updateField('cover_image_url', url)}
                  placeholder="Upload cover image"
                  currentImageUrl={data.cover_image_url || null}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Hours & Contact */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in-up">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-lokal-midnight-light flex items-center justify-center mb-4">
                <Clock className="h-7 w-7 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold mb-1">When are you open?</h1>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2 mb-2">
                <Button type="button" size="sm" variant="outline" onClick={copyHoursToWeekdays} className="gap-1 text-xs">
                  <Copy className="h-3 w-3" /> Copy Mon → Weekdays
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={copyHoursToWeekend} className="gap-1 text-xs">
                  <Copy className="h-3 w-3" /> Copy Sat → Sun
                </Button>
              </div>

              {DAYS.map(day => {
                const dayHours = data.hours[day] || { open: '09:00', close: '17:00', closed: false };
                return (
                  <div key={day} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                    <span className="w-16 text-sm font-medium capitalize">{day.slice(0, 3)}</span>
                    <Switch
                      checked={!dayHours.closed}
                      onCheckedChange={(checked) => {
                        const updated = { ...data.hours };
                        updated[day] = { ...dayHours, closed: !checked };
                        updateField('hours', updated);
                      }}
                    />
                    {!dayHours.closed && (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="time"
                          value={dayHours.open}
                          onChange={(e) => {
                            const updated = { ...data.hours };
                            updated[day] = { ...dayHours, open: e.target.value };
                            updateField('hours', updated);
                          }}
                          className="h-8 text-sm"
                        />
                        <span className="text-muted-foreground text-xs">to</span>
                        <Input
                          type="time"
                          value={dayHours.close}
                          onChange={(e) => {
                            const updated = { ...data.hours };
                            updated[day] = { ...dayHours, close: e.target.value };
                            updateField('hours', updated);
                          }}
                          className="h-8 text-sm"
                        />
                      </div>
                    )}
                    {dayHours.closed && <span className="text-xs text-muted-foreground">Closed</span>}
                  </div>
                );
              })}
            </div>

            {/* Social links */}
            <div className="space-y-3 rounded-2xl border border-border/50 p-4">
              <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Social Links</Label>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Instagram className="h-4 w-4 text-[#E4405F] flex-shrink-0" />
                  <Input value={data.instagram} onChange={(e) => updateField('instagram', e.target.value)} placeholder="@yourbusiness" className="h-9" />
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                  <Input value={data.tiktok} onChange={(e) => updateField('tiktok', e.target.value)} placeholder="@yourbusiness" className="h-9" />
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-[#1877F2] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <Input value={data.facebook} onChange={(e) => updateField('facebook', e.target.value)} placeholder="YourBusinessPage" className="h-9" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: You're In! */}
        {step === 5 && (
          <div className="space-y-6 animate-fade-in-up text-center">
            <div className="pt-8">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6">
                <PartyPopper className="h-10 w-10 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold mb-2">You're all set!</h1>
              <p className="text-lg text-muted-foreground">Welcome to Toledo Lokal.</p>
            </div>

            {tierStatus !== 'community' && tierStatus !== 'growth' && (
              <div className="flex flex-col items-center gap-3 py-6">
                <TierBadge tier={tierStatus as 'founding_5' | 'founding_50' | 'community' | 'growth' | 'pro'} size="lg" />
                <p className="text-sm text-muted-foreground">
                  You're one of our {tierStatus === 'founding_5' ? 'Founding 5' : 'Founding 50'} partners!
                </p>
              </div>
            )}

            <div className="text-left space-y-3 rounded-2xl bg-secondary p-5">
              <p className="text-sm font-medium">Here's what happens next:</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  Your profile is now live on Toledo Lokal
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  You can update your info anytime from your dashboard
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  We'll be in touch about Loop Points setup and community features
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Fixed bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border safe-area-bottom">
        <div className="max-w-lg mx-auto px-4 py-3 flex gap-3">
          {step > 1 && step < 5 && (
            <Button variant="outline" onClick={goBack} className="gap-1">
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
          )}
          {step < 5 && (
            <>
              {step > 1 && (
                <Button variant="ghost" onClick={goNext} className="text-muted-foreground">
                  Skip for now
                </Button>
              )}
              <Button
                onClick={goNext}
                className="flex-1 gap-1"
                disabled={saveProgress.isPending}
              >
                {saveProgress.isPending ? 'Saving...' : 'Continue'}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
          {step === 5 && (
            <Button
              onClick={handleComplete}
              className="flex-1 h-12 text-base"
              disabled={saveProgress.isPending}
            >
              {saveProgress.isPending ? 'Finishing...' : 'Go to My Dashboard'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
