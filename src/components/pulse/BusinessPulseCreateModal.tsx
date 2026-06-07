import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useCreatePulsePost, useBusinessPulsePostsToday } from '@/hooks/usePulse';
import { getPulseTierLimits } from '@/lib/pulse-config';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { useToast } from '@/hooks/use-toast';
import {
  Megaphone,
  UtensilsCrossed,
  Calendar,
  Trophy,
  MapPin,
  Pin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

type PostType = 'update' | 'menu_item' | 'event' | 'milestone' | 'popup';

interface PostTypeConfig {
  id: PostType;
  label: string;
  icon: React.ElementType;
  category: 'right_now' | 'heads_up' | 'good_stuff';
  expirationHours: number;
  placeholder: string;
}

const POST_TYPES: PostTypeConfig[] = [
  {
    id: 'update',
    label: 'Update',
    icon: Megaphone,
    category: 'good_stuff',
    expirationHours: 24,
    placeholder: "What's new at your business?",
  },
  {
    id: 'menu_item',
    label: 'Menu Item',
    icon: UtensilsCrossed,
    category: 'right_now',
    expirationHours: 4,
    placeholder: "Today's special or new item...",
  },
  {
    id: 'event',
    label: 'Event',
    icon: Calendar,
    category: 'heads_up',
    expirationHours: 24,
    placeholder: 'Tell the community about your upcoming event...',
  },
  {
    id: 'milestone',
    label: 'Milestone',
    icon: Trophy,
    category: 'good_stuff',
    expirationHours: 24,
    placeholder: "Share exciting news or a milestone you've reached...",
  },
  {
    id: 'popup',
    label: 'Pop-Up',
    icon: MapPin,
    category: 'right_now',
    expirationHours: 4,
    placeholder: "Where are you set up today and when?",
  },
];

interface Props {
  businessId: string;
  businessName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BusinessPulseCreateModal({ businessId, businessName, open, onOpenChange }: Props) {
  const { user } = useAuth();
  const { tier, tierConfig, ensureLoaded: ensureSubLoaded } = useSubscription();
  useEffect(() => { ensureSubLoaded(); }, [ensureSubLoaded]);
  const { toast } = useToast();
  const createPost = useCreatePulsePost();

  const [postType, setPostType] = useState<PostType | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isPinned, setIsPinned] = useState(false);

  const { data: businessPostsToday = 0 } = useBusinessPulsePostsToday(businessId);

  const limits = useMemo(() => getPulseTierLimits(true, tier), [tier]);

  const postsRemaining = useMemo(
    () => Math.max(0, limits.postsPerDay - businessPostsToday),
    [limits.postsPerDay, businessPostsToday]
  );

  const selectedType = postType ? POST_TYPES.find(t => t.id === postType) : null;

  const canSubmit =
    postType !== null &&
    content.trim().length > 0 &&
    content.length <= 140 &&
    postsRemaining > 0 &&
    !createPost.isPending;

  const resetForm = () => {
    setPostType(null);
    setTitle('');
    setContent('');
    setImageUrl(null);
    setIsPinned(false);
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) resetForm();
    onOpenChange(value);
  };

  const handleSubmit = async () => {
    if (!canSubmit || !selectedType) return;

    try {
      await createPost.mutateAsync({
        category: selectedType.category,
        content: content.trim(),
        expirationHours: selectedType.expirationHours,
        businessId,
        isPinned: limits.canPin ? isPinned : false,
        postType,
        title: title.trim() || undefined,
        imageUrl: imageUrl || undefined,
        authorId: user?.id,
        businessTier: tier,
      });

      toast({ title: 'Posted to The Pulse!' });
      handleOpenChange(false);
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create post. Please try again.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post to Pulse</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Posts remaining */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Posts remaining today</span>
            <Badge variant={postsRemaining === 0 ? 'destructive' : 'secondary'}>
              {postsRemaining} / {limits.postsPerDay}
            </Badge>
          </div>

          {/* Limit hit message */}
          {postsRemaining === 0 && (
            <Alert>
              <AlertDescription>
                You've used all your Pulse posts for today!{' '}
                <Link to="/dashboard/subscription" className="text-primary underline font-medium" onClick={() => handleOpenChange(false)}>
                  Upgrade your plan for more.
                </Link>
              </AlertDescription>
            </Alert>
          )}

          {/* Post type pills */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Post type</Label>
            <div className="grid grid-cols-2 gap-2">
              {POST_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = postType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setPostType(type.id)}
                    className={cn(
                      'flex items-center gap-2 p-3 rounded-lg border text-left transition-all text-sm',
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-secondary'
                    )}
                  >
                    <Icon className={cn('h-4 w-4 flex-shrink-0', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                    <span className={cn('font-medium', isSelected ? 'text-primary' : '')}>{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Title <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              placeholder="Give it a headline (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={60}
            />
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Message</Label>
              <span className={cn(
                'text-xs',
                content.length > 140 ? 'text-destructive' : 'text-muted-foreground'
              )}>
                {content.length}/140
              </span>
            </div>
            <Textarea
              placeholder={selectedType?.placeholder ?? "What's happening at your business?"}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={150}
              className="resize-none h-24"
            />
          </div>

          {/* Image upload */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Image <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <ImageUpload
              folder="pulse"
              label="Add a photo"
              onUpload={(path) => setImageUrl(path)}
              onRemove={() => setImageUrl(null)}
              currentUrl={imageUrl ?? undefined}
            />
          </div>

          {/* Pin toggle — paid tiers only */}
          {limits.canPin && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-2">
                <Pin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-sm font-medium">Pin to top</span>
                  <p className="text-xs text-muted-foreground">Up to {limits.maxPinnedPerDay}/day on your plan</p>
                </div>
              </div>
              <Switch checked={isPinned} onCheckedChange={setIsPinned} />
            </div>
          )}

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full"
          >
            {createPost.isPending ? 'Posting...' : 'Post to The Pulse'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
