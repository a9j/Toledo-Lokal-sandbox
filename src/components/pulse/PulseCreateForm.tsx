import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useCreatePulsePost, useUserPulsePostsToday, useBusinessPulsePostsToday } from '@/hooks/usePulse';
import { 
  PULSE_CATEGORIES, 
  PulseCategory, 
  getPulseTierLimits, 
  containsPromoLanguage,
  getExpirationOptions 
} from '@/lib/pulse-config';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Zap, AlertTriangle, Activity, HelpCircle, Heart, MapPin, Building2, Pin, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const CATEGORY_ICONS = {
  right_now: Zap,
  heads_up: AlertTriangle,
  energy_check: Activity,
  community_ask: HelpCircle,
  good_stuff: Heart,
};

export function PulseCreateForm() {
  const { user } = useAuth();
  const { tier } = useSubscription();
  const { toast } = useToast();
  const createPost = useCreatePulsePost();

  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<PulseCategory | null>(null);
  const [content, setContent] = useState('');
  const [expirationHours, setExpirationHours] = useState<number | null>(null);
  const [locationText, setLocationText] = useState('');
  const [postAsBusiness, setPostAsBusiness] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  // Fetch user's business
  const { data: userBusiness } = useQuery({
    queryKey: ['user-business', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name, status')
        .eq('owner_user_id', user.id)
        .eq('status', 'approved')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: userPostsToday = 0 } = useUserPulsePostsToday();
  const { data: businessPostsToday = 0 } = useBusinessPulsePostsToday(
    postAsBusiness ? userBusiness?.id : undefined
  );

  const limits = useMemo(() => {
    return getPulseTierLimits(postAsBusiness, postAsBusiness ? tier : null);
  }, [postAsBusiness, tier]);

  const postsRemaining = useMemo(() => {
    const postsToday = postAsBusiness ? businessPostsToday : userPostsToday;
    return Math.max(0, limits.postsPerDay - postsToday);
  }, [postAsBusiness, businessPostsToday, userPostsToday, limits]);

  const expirationOptions = useMemo(() => {
    if (!category) return [];
    return getExpirationOptions(category, limits.expirationMultiplier);
  }, [category, limits]);

  const hasPromoLanguage = containsPromoLanguage(content);
  const promoBlocked = hasPromoLanguage && !limits.canUsePromoLanguage;

  const canPin = limits.canPin && isPinned;
  const categoryAllowed = category ? limits.allowedCategories.includes(category) : true;

  const canSubmit = 
    category && 
    content.trim() && 
    content.length <= 140 && 
    expirationHours && 
    postsRemaining > 0 &&
    !promoBlocked &&
    categoryAllowed;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    try {
      await createPost.mutateAsync({
        category,
        content: content.trim(),
        expirationHours,
        locationText: locationText.trim() || undefined,
        businessId: postAsBusiness ? userBusiness?.id : undefined,
        isPinned: canPin,
      });

      toast({ title: 'Posted to The Pulse!' });
      setOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: error.message 
      });
    }
  };

  const resetForm = () => {
    setCategory(null);
    setContent('');
    setExpirationHours(null);
    setLocationText('');
    setIsPinned(false);
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 rounded-full">
          <Plus className="h-4 w-4" />
          Post to Pulse
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-background border-border">
        <DialogHeader>
          <DialogTitle>What's happening?</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Post as business toggle */}
          {userBusiness && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Post as {userBusiness.name}</span>
              </div>
              <Switch
                checked={postAsBusiness}
                onCheckedChange={setPostAsBusiness}
              />
            </div>
          )}

          {/* Posts remaining */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Posts remaining today</span>
            <Badge variant={postsRemaining === 0 ? "destructive" : "secondary"}>
              {postsRemaining} / {limits.postsPerDay}
            </Badge>
          </div>

          {postsRemaining === 0 && (
            <Alert>
              <AlertDescription>
                You've reached your daily posting limit.
                {postAsBusiness && tier === 'free' && (
                  <Link to="/subscription" className="text-primary ml-1 underline">
                    Upgrade to post more.
                  </Link>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Category selection */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Category</Label>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(PULSE_CATEGORIES).map((cat) => {
                const Icon = CATEGORY_ICONS[cat.id];
                const isAllowed = limits.allowedCategories.includes(cat.id);
                const isSelected = category === cat.id;

                return (
                  <button
                    key={cat.id}
                    onClick={() => isAllowed && setCategory(cat.id)}
                    disabled={!isAllowed}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg border text-left transition-all text-sm",
                      isSelected && "border-primary bg-primary/10",
                      !isSelected && isAllowed && "border-border hover:bg-secondary",
                      !isAllowed && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", cat.color)} />
                    <span className="font-medium">{cat.label}</span>
                    {!isAllowed && <Lock className="h-3 w-3 ml-auto" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Message</Label>
              <span className={cn(
                "text-xs",
                content.length > 140 ? "text-destructive" : "text-muted-foreground"
              )}>
                {content.length}/140
              </span>
            </div>
            <Textarea
              placeholder={category ? PULSE_CATEGORIES[category].examples[0] : "What's happening in Toledo?"}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={150}
              className="resize-none h-20"
            />
            {promoBlocked && (
              <p className="text-xs text-destructive mt-1">
                Promotional language requires a paid business plan.{' '}
                <Link to="/subscription" className="underline">Upgrade</Link>
              </p>
            )}
          </div>

          {/* Expiration */}
          {category && (
            <div>
              <Label className="text-sm font-medium mb-2 block">Expires in</Label>
              <Select 
                value={expirationHours?.toString()} 
                onValueChange={(v) => setExpirationHours(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select expiration" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {expirationOptions.map((opt) => (
                    <SelectItem key={opt.hours} value={opt.hours.toString()}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Location */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Location (optional)</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="e.g., Downtown, Sylvania"
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                className="pl-9"
                maxLength={50}
              />
            </div>
          </div>

          {/* Pin option for paid businesses */}
          {postAsBusiness && limits.canPin && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-2">
                <Pin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Pin to top</span>
              </div>
              <Switch
                checked={isPinned}
                onCheckedChange={setIsPinned}
              />
            </div>
          )}

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || createPost.isPending}
            className="w-full"
          >
            {createPost.isPending ? 'Posting...' : 'Post to The Pulse'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
