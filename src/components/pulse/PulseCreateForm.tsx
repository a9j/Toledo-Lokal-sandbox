import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import {
  useCreatePulsePost,
  useUserPulsePostsToday,
  useBusinessPulsePostsToday,
} from '@/hooks/usePulse';
import { usePulseTrust } from '@/hooks/usePulseTrust';
import {
  PulseTemplate,
  PulseContentType,
  PulseCategory,
  PULSE_CATEGORY_TAGS,
  PULSE_MOMENT_MAX_LENGTH,
  PULSE_CONTENT_TYPES,
  getTemplatesFor,
  getPulseTierLimits,
  getTrustLevelConfig,
  containsPromoLanguage,
} from '@/lib/pulse-config';
import { NEIGHBORHOODS } from '@/lib/neighborhoods';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Plus, ChevronLeft, Building2, MapPin, Lock, CalendarDays, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { PulseIcon } from './PulseIcon';

const CONTENT_TYPE_TO_CATEGORY: Record<PulseContentType, PulseCategory> = {
  business_activity: 'right_now',
  community_activity: 'community_ask',
  local_moment: 'good_stuff',
  city_signal: 'energy_check',
};

function expirationChoices(t: PulseTemplate) {
  const candidates = [t.defaultExpirationHours, 24, 48, t.maxExpirationHours];
  const uniq = [...new Set(candidates)].filter((h) => h > 0 && h <= t.maxExpirationHours).sort((a, b) => a - b);
  return uniq.map((h) => ({
    hours: h,
    label: h < 24 ? `${h} hour${h > 1 ? 's' : ''}` : `${h / 24} day${h / 24 > 1 ? 's' : ''}`,
  }));
}

interface PlaceResult {
  id: string;
  name: string;
}

export function PulseCreateForm() {
  const { user } = useAuth();
  const { tier, ensureLoaded } = useSubscription();
  const { toast } = useToast();
  const createPost = useCreatePulsePost();
  const { data: trust } = usePulseTrust();

  useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);

  const [open, setOpen] = useState(false);
  const [authorKind, setAuthorKind] = useState<'user' | 'business'>('user');
  const [template, setTemplate] = useState<PulseTemplate | null>(null);
  const [content, setContent] = useState('');
  const [neighborhood, setNeighborhood] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [whyItMatters, setWhyItMatters] = useState('');
  const [expirationHours, setExpirationHours] = useState<number | null>(null);
  const [placeQuery, setPlaceQuery] = useState('');
  const [place, setPlace] = useState<PlaceResult | null>(null);
  // Event fields
  const [postType, setPostType] = useState<'update' | 'event' | 'deal'>('update');
  const [eventDate, setEventDate] = useState('');
  const [eventStartTime, setEventStartTime] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [addToCalendar, setAddToCalendar] = useState(true);

  // The user's approved business (enables "post as business").
  const { data: userBusiness } = useQuery({
    queryKey: ['user-business', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('businesses')
        .select('id, name, status')
        .eq('owner_user_id', user.id)
        .eq('status', 'approved')
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // The user's home neighborhood, used as a sensible default.
  const { data: homeNeighborhood } = useQuery({
    queryKey: ['compose-home-neighborhood', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('neighborhoods(name)')
        .eq('user_id', user.id)
        .maybeSingle();
      return (data as { neighborhoods?: { name?: string } | null } | null)?.neighborhoods?.name ?? null;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (homeNeighborhood && !neighborhood) setNeighborhood(homeNeighborhood);
  }, [homeNeighborhood, neighborhood]);

  // Place search (for moments / check-ins tied to a real place).
  const { data: placeResults } = useQuery({
    queryKey: ['pulse-place-search', placeQuery],
    queryFn: async () => {
      const { data } = await supabase
        .from('businesses')
        .select('id, name')
        .eq('status', 'approved')
        .ilike('name', `%${placeQuery}%`)
        .limit(6);
      return (data || []) as PlaceResult[];
    },
    enabled: placeQuery.trim().length >= 2 && !place,
  });

  const postingAsBusiness = authorKind === 'business' && !!userBusiness;
  const availableTemplates = useMemo(
    () => getTemplatesFor([postingAsBusiness ? 'business' : 'user']),
    [postingAsBusiness]
  );

  // Daily limits: businesses by subscription tier, residents by trust level.
  const businessLimits = getPulseTierLimits(true, tier);
  const trustLevel = getTrustLevelConfig(trust?.level);
  const { data: userPostsToday = 0 } = useUserPulsePostsToday();
  const { data: businessPostsToday = 0 } = useBusinessPulsePostsToday(
    postingAsBusiness ? userBusiness?.id : undefined
  );

  const dailyLimit = postingAsBusiness ? businessLimits.postsPerDay : trustLevel.dailyPostLimit;
  const postsToday = postingAsBusiness ? businessPostsToday : userPostsToday;
  const postsRemaining = Math.max(0, dailyLimit - postsToday);

  const promoBlocked =
    postingAsBusiness && !businessLimits.canUsePromoLanguage && containsPromoLanguage(content);

  const needsPlace = !!template?.requiresPlace;
  const overLimit = content.length > PULSE_MOMENT_MAX_LENGTH;

  const eventFieldsValid = postType !== 'event' || !!eventDate;

  const canSubmit =
    !!template &&
    content.trim().length > 0 &&
    !overLimit &&
    !!expirationHours &&
    !!neighborhood &&
    postsRemaining > 0 &&
    !promoBlocked &&
    (!needsPlace || !!place) &&
    eventFieldsValid;

  const resetForm = () => {
    setTemplate(null);
    setContent('');
    setTags([]);
    setWhyItMatters('');
    setExpirationHours(null);
    setPlace(null);
    setPlaceQuery('');
    setPostType('update');
    setEventDate('');
    setEventStartTime('');
    setEventEndTime('');
    setLocationName('');
    setLocationAddress('');
    setAddToCalendar(true);
  };

  const selectTemplate = (t: PulseTemplate) => {
    setTemplate(t);
    setExpirationHours(t.defaultExpirationHours);
  };

  const toggleTag = (id: string) => {
    setTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : prev.length >= 3 ? prev : [...prev, id]));
  };

  const handleSubmit = async () => {
    if (!template || !canSubmit) return;
    try {
      await createPost.mutateAsync({
        category: CONTENT_TYPE_TO_CATEGORY[template.contentType],
        contentType: template.contentType,
        templateKey: template.key,
        content: content.trim(),
        expirationHours: expirationHours!,
        neighborhood,
        tags,
        whyItMatters: whyItMatters.trim() || undefined,
        businessId: postingAsBusiness ? userBusiness?.id : undefined,
        placeBusinessId: place?.id,
        locationText: locationName || place?.name || neighborhood,
        postType,
        eventDate: postType === 'event' ? eventDate : undefined,
        eventStartTime: postType === 'event' ? eventStartTime || undefined : undefined,
        eventEndTime: postType === 'event' ? eventEndTime || undefined : undefined,
        locationName: locationName || undefined,
        locationAddress: locationAddress || undefined,
        addToBusinessCalendar: postingAsBusiness && postType === 'event' && addToCalendar,
      });
      toast({ title: 'Posted to Pulse', description: 'Your update is live across the city.' });
      setOpen(false);
      resetForm();
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not post. Please try again.' });
    }
  };

  if (!user) {
    return (
      <Link to="/auth">
        <Button className="gap-2 rounded-full">
          <Plus className="h-4 w-4" />
          Post to Pulse
        </Button>
      </Link>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2 rounded-full">
          <Plus className="h-4 w-4" />
          Post to Pulse
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-background border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {template && (
              <button onClick={() => setTemplate(null)} className="text-muted-foreground hover:text-foreground">
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            {template ? template.label : 'Share something local'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Author toggle */}
          {userBusiness && (
            <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Post as {userBusiness.name}
              </span>
              <Switch
                checked={postingAsBusiness}
                onCheckedChange={(v) => {
                  setAuthorKind(v ? 'business' : 'user');
                  setTemplate(null);
                }}
              />
            </div>
          )}

          {/* Posts remaining */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {postingAsBusiness ? 'Business posts today' : `${trustLevel.label} · posts today`}
            </span>
            <Badge variant={postsRemaining === 0 ? 'destructive' : 'secondary'}>
              {postsRemaining} / {dailyLimit} left
            </Badge>
          </div>

          {postsRemaining === 0 && (
            <Alert>
              <AlertDescription>
                You've hit your daily posting limit.
                {!postingAsBusiness && ' Keep checking in and participating locally to earn more.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Step 1: pick a template (structured posting only) */}
          {!template ? (
            <div>
              <Label className="mb-2 block text-sm font-medium">Pick a format</Label>
              <div className="grid grid-cols-2 gap-2">
                {availableTemplates.map((t) => {
                  const typeConfig = PULSE_CONTENT_TYPES[t.contentType];
                  return (
                    <button
                      key={t.key}
                      onClick={() => selectTemplate(t)}
                      className="flex flex-col items-start gap-1 rounded-lg border border-border p-3 text-left transition-all hover:border-primary hover:bg-secondary"
                    >
                      <PulseIcon name={t.icon} className={cn('h-4 w-4', typeConfig.accent)} />
                      <span className="text-sm font-medium leading-tight">{t.label}</span>
                      <span className="text-[11px] leading-tight text-muted-foreground">{t.description}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                Every Pulse post uses a format. This keeps the city feed clean and useful.
              </p>
            </div>
          ) : (
            <>
              {/* Post type selector */}
              <div>
                <Label className="mb-1.5 block text-sm font-medium">Post type</Label>
                <div className="flex gap-1.5">
                  {(['update', 'event', 'deal'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setPostType(t)}
                      className={cn(
                        'rounded-full border px-3 py-1 text-sm font-medium transition-all capitalize',
                        postType === t
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:bg-secondary'
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Event fields (shown when post type = Event) */}
              {postType === 'event' && (
                <div className="space-y-3 rounded-lg border border-border/60 bg-secondary/30 p-3">
                  <div>
                    <Label className="mb-1 block text-sm font-medium">
                      <CalendarDays className="mr-1 inline h-3.5 w-3.5" />
                      Date
                    </Label>
                    <Input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="mb-1 block text-sm font-medium">
                        <Clock className="mr-1 inline h-3.5 w-3.5" />
                        Start time
                      </Label>
                      <Input
                        type="time"
                        value={eventStartTime}
                        onChange={(e) => setEventStartTime(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="mb-1 block text-sm font-medium">End time</Label>
                      <Input
                        type="time"
                        value={eventEndTime}
                        onChange={(e) => setEventEndTime(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="mb-1 block text-sm font-medium">
                      <MapPin className="mr-1 inline h-3.5 w-3.5" />
                      Location / venue
                    </Label>
                    <Input
                      placeholder="e.g. The Flying Joe"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-sm font-medium">
                      Address <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      placeholder="e.g. 123 Main St, Toledo"
                      value={locationAddress}
                      onChange={(e) => setLocationAddress(e.target.value)}
                    />
                  </div>
                  {postingAsBusiness && (
                    <div className="flex items-center justify-between rounded-lg bg-background px-3 py-2">
                      <span className="text-sm font-medium">Also add to my business calendar</span>
                      <Switch checked={addToCalendar} onCheckedChange={setAddToCalendar} />
                    </div>
                  )}
                </div>
              )}

              {/* Location fields for non-event posts */}
              {postType !== 'event' && (
                <div className="space-y-3">
                  {locationName || locationAddress ? (
                    <>
                      <div>
                        <Label className="mb-1 block text-sm font-medium">
                          <MapPin className="mr-1 inline h-3.5 w-3.5" />
                          Location <span className="text-muted-foreground">(optional)</span>
                        </Label>
                        <Input
                          placeholder="Venue or place name"
                          value={locationName}
                          onChange={(e) => setLocationName(e.target.value)}
                        />
                      </div>
                    </>
                  ) : null}
                </div>
              )}

              {/* Place picker for moments / check-ins */}
              {needsPlace && (
                <div>
                  <Label className="mb-1.5 block text-sm font-medium">Which place?</Label>
                  {place ? (
                    <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
                      <span className="flex items-center gap-1.5 text-sm font-medium">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        {place.name}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => setPlace(null)}>
                        Change
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Input
                        placeholder="Search a local business…"
                        value={placeQuery}
                        onChange={(e) => setPlaceQuery(e.target.value)}
                      />
                      {!!placeResults?.length && (
                        <div className="mt-1 overflow-hidden rounded-lg border border-border">
                          {placeResults.map((r) => (
                            <button
                              key={r.id}
                              onClick={() => {
                                setPlace(r);
                                setPlaceQuery('');
                              }}
                              className="block w-full px-3 py-2 text-left text-sm hover:bg-secondary"
                            >
                              {r.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Content */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <Label className="text-sm font-medium">{template.prompt}</Label>
                  <span className={cn('text-xs', overLimit ? 'text-destructive' : 'text-muted-foreground')}>
                    {content.length}/{PULSE_MOMENT_MAX_LENGTH}
                  </span>
                </div>
                <Textarea
                  placeholder={template.examples[0]}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={PULSE_MOMENT_MAX_LENGTH + 10}
                  className="h-20 resize-none"
                />
                {promoBlocked && (
                  <p className="mt-1 text-xs text-destructive">
                    Heavy promo language needs a paid plan.{' '}
                    <Link to="/subscription" className="underline">
                      Upgrade
                    </Link>
                  </p>
                )}
              </div>

              {/* Neighborhood */}
              <div>
                <Label className="mb-1.5 block text-sm font-medium">Neighborhood</Label>
                <Select value={neighborhood} onValueChange={setNeighborhood}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pick a neighborhood" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {NEIGHBORHOODS.map((n) => (
                      <SelectItem key={n.id} value={n.id}>
                        {n.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category tags */}
              <div>
                <Label className="mb-1.5 block text-sm font-medium">
                  Tags <span className="text-muted-foreground">(up to 3)</span>
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {PULSE_CATEGORY_TAGS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => toggleTag(c.id)}
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-xs font-medium transition-all',
                        tags.includes(c.id)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:bg-secondary'
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Expiration */}
              <div>
                <Label className="mb-1.5 block text-sm font-medium">Expires in</Label>
                <Select
                  value={expirationHours?.toString()}
                  onValueChange={(v) => setExpirationHours(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {expirationChoices(template).map((opt) => (
                      <SelectItem key={opt.hours} value={opt.hours.toString()}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Why it matters (optional) */}
              <div>
                <Label className="mb-1.5 block text-sm font-medium">
                  Why it matters <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  placeholder="One line on why locals should care"
                  value={whyItMatters}
                  onChange={(e) => setWhyItMatters(e.target.value)}
                  maxLength={80}
                />
              </div>

              <Button onClick={handleSubmit} disabled={!canSubmit || createPost.isPending} className="w-full">
                {createPost.isPending ? 'Posting…' : needsPlace && !place ? (
                  <span className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" /> Pick a place first
                  </span>
                ) : (
                  'Post to Pulse'
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
