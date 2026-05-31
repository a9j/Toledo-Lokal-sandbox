import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBusinessPulsePosts } from '@/hooks/useBusinessPulsePosts';
import { useCreatePulsePost } from '@/hooks/usePulse';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
} from '@/components/ui/dialog';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { SecureImage } from '@/components/ui/secure-image';
import {
  Plus,
  Pin,
  PinOff,
  Trash2,
  Pencil,
  Eye,
  EyeOff,
  Loader2,
  Heart,
  MessageSquare,
  Flag,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PulseManagerProps {
  businessId: string;
}

const POST_TYPE_OPTIONS = [
  { value: 'update', label: 'Update' },
  { value: 'event', label: 'Event' },
  { value: 'deal', label: 'Deal' },
];

const CATEGORY_OPTIONS = [
  { value: 'right_now', label: 'Right Now' },
  { value: 'heads_up', label: 'Heads Up' },
  { value: 'good_stuff', label: 'Good Stuff' },
  { value: 'community_ask', label: 'Community' },
  { value: 'energy_check', label: 'Energy Check' },
];

const EXPIRATION_OPTIONS = [
  { value: '24', label: '24 hours' },
  { value: '48', label: '48 hours' },
  { value: '72', label: '3 days' },
  { value: '168', label: '7 days' },
];

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-emerald-100 text-emerald-800' },
  hidden: { label: 'Hidden', className: 'bg-slate-100 text-slate-700' },
  removed: { label: 'Removed', className: 'bg-red-100 text-red-800' },
  expired: { label: 'Expired', className: 'bg-amber-100 text-amber-800' },
};

export function PulseManager({ businessId }: PulseManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: posts, isLoading } = useBusinessPulsePosts(businessId);
  const createPost = useCreatePulsePost();

  const [composerOpen, setComposerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  // Composer state
  const [content, setContent] = useState('');
  const [headline, setHeadline] = useState('');
  const [postType, setPostType] = useState<string>('update');
  const [category, setCategory] = useState<string>('right_now');
  const [expirationHours, setExpirationHours] = useState('48');
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState('');

  const resetComposer = () => {
    setContent('');
    setHeadline('');
    setPostType('update');
    setCategory('right_now');
    setExpirationHours('48');
    setHeroImage(null);
    setLinkUrl('');
    setEditingId(null);
  };

  const openComposer = () => {
    resetComposer();
    setComposerOpen(true);
  };

  const openEditor = (post: Record<string, unknown>) => {
    setContent((post.content as string) || '');
    setHeadline((post.headline as string) || '');
    setPostType((post.post_type as string) || 'update');
    setCategory((post.category as string) || 'right_now');
    setHeroImage((post.hero_image as string) || null);
    setEditingId(post.id as string);
    setComposerOpen(true);
  };

  const handleCreate = () => {
    if (!content.trim()) return;
    createPost.mutate(
      {
        category: category as 'right_now' | 'heads_up' | 'energy_check' | 'community_ask' | 'good_stuff',
        content: content.trim(),
        expirationHours: parseInt(expirationHours, 10),
        businessId,
        contentType: 'business_activity',
        headline: headline.trim() || undefined,
        heroImage: heroImage || undefined,
        postType: postType as 'update' | 'event' | 'deal',
        shareEnabled: true,
      },
      {
        onSuccess: () => {
          toast({ title: 'Post published' });
          setComposerOpen(false);
          resetComposer();
          queryClient.invalidateQueries({ queryKey: ['business-pulse-posts', businessId] });
        },
        onError: (e: Error) => {
          toast({ variant: 'destructive', title: 'Could not publish', description: e.message });
        },
      }
    );
  };

  const updatePost = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const { error } = await supabase
        .from('pulse_posts')
        .update(data)
        .eq('id', id)
        .eq('business_id', businessId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-pulse-posts', businessId] });
    },
  });

  const handleUpdate = () => {
    if (!editingId || !content.trim()) return;
    updatePost.mutate(
      {
        id: editingId,
        data: {
          content: content.trim(),
          headline: headline.trim() || null,
          hero_image: heroImage,
          post_type: postType,
          category,
        },
      },
      {
        onSuccess: () => {
          toast({ title: 'Post updated' });
          setComposerOpen(false);
          resetComposer();
        },
        onError: (e: Error) => {
          toast({ variant: 'destructive', title: 'Could not update', description: e.message });
        },
      }
    );
  };

  const togglePin = (id: string, currentlyPinned: boolean) => {
    updatePost.mutate(
      { id, data: { is_pinned: !currentlyPinned } },
      {
        onSuccess: () => toast({ title: currentlyPinned ? 'Unpinned' : 'Pinned to top' }),
        onError: (e: Error) => toast({ variant: 'destructive', title: 'Failed', description: e.message }),
      }
    );
  };

  const toggleVisibility = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'hidden' : 'active';
    updatePost.mutate(
      { id, data: { status: newStatus } },
      {
        onSuccess: () => toast({ title: newStatus === 'active' ? 'Post visible' : 'Post hidden' }),
        onError: (e: Error) => toast({ variant: 'destructive', title: 'Failed', description: e.message }),
      }
    );
  };

  const deletePost = (id: string) => {
    updatePost.mutate(
      { id, data: { status: 'removed' } },
      {
        onSuccess: () => toast({ title: 'Post removed' }),
        onError: (e: Error) => toast({ variant: 'destructive', title: 'Failed', description: e.message }),
      }
    );
  };

  const filtered = posts?.filter((p) => {
    if (filter === 'all') return p.status !== 'removed';
    return p.status === filter;
  });

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold tracking-tight">Pulse</h2>
          <p className="text-sm text-muted-foreground">
            Share updates, specials, and announcements with your community.
          </p>
        </div>
        <Button onClick={openComposer} className="gap-1.5">
          <Plus className="h-4 w-4" /> New Post
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'active', 'hidden', 'expired'].map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? 'default' : 'outline'}
            className="rounded-full text-xs capitalize"
            onClick={() => setFilter(f)}
          >
            {f}
            {f !== 'all' && (
              <span className="ml-1 text-[10px] opacity-70">
                {posts?.filter((p) => p.status === f || (f === 'expired' && isExpired(p.expires_at) && p.status === 'active')).length || 0}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Post list */}
      {!filtered?.length ? (
        <div className="card-elevated p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {filter === 'all'
              ? 'No posts yet. Share your first update with the community.'
              : `No ${filter} posts.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => {
            const expired = isExpired(post.expires_at);
            const status = expired && post.status === 'active' ? 'expired' : post.status;
            const statusInfo = STATUS_LABELS[status] || STATUS_LABELS.active;

            return (
              <div
                key={post.id}
                className={cn(
                  'card-elevated p-4 space-y-3',
                  post.is_pinned && 'ring-1 ring-primary/20',
                  (status === 'hidden' || status === 'expired') && 'opacity-70'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {post.headline && (
                      <p className="font-semibold text-sm mb-0.5">{post.headline}</p>
                    )}
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap line-clamp-4">{post.content}</p>
                  </div>
                  {post.hero_image && (
                    <SecureImage
                      src={post.hero_image}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={cn('text-[10px]', statusInfo.className)}>
                    {statusInfo.label}
                  </Badge>
                  {post.is_pinned && (
                    <Badge variant="outline" className="text-[10px] gap-0.5">
                      <Pin className="h-2.5 w-2.5" /> Pinned
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {post.post_type || 'update'}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>

                {/* Engagement stats */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {post.reaction_count || 0}</span>
                  <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {post.helpful_count || 0}</span>
                  {post.flag_count > 0 && (
                    <span className="flex items-center gap-1 text-destructive"><Flag className="h-3 w-3" /> {post.flag_count}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1.5 pt-1 border-t border-border/50">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1"
                    onClick={() => openEditor(post as unknown as Record<string, unknown>)}
                  >
                    <Pencil className="h-3 w-3" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1"
                    onClick={() => togglePin(post.id, post.is_pinned)}
                  >
                    {post.is_pinned ? <><PinOff className="h-3 w-3" /> Unpin</> : <><Pin className="h-3 w-3" /> Pin</>}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1"
                    onClick={() => toggleVisibility(post.id, post.status)}
                  >
                    {post.status === 'active' ? <><EyeOff className="h-3 w-3" /> Hide</> : <><Eye className="h-3 w-3" /> Show</>}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1 text-destructive hover:text-destructive ml-auto"
                    onClick={() => deletePost(post.id)}
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Composer dialog */}
      <Dialog open={composerOpen} onOpenChange={(open) => { if (!open) { setComposerOpen(false); resetComposer(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Post' : 'New Pulse Post'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="headline">Headline (optional)</Label>
              <Input
                id="headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Short attention-grabber"
                maxLength={80}
              />
            </div>
            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's happening at your business?"
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">{content.length}/500</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={postType} onValueChange={setPostType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {POST_TYPE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!editingId && (
                <div>
                  <Label>Expires</Label>
                  <Select value={expirationHours} onValueChange={setExpirationHours}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EXPIRATION_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div>
              <Label>Image (optional)</Label>
              {heroImage ? (
                <div className="relative inline-block">
                  <SecureImage src={heroImage} alt="" className="w-32 h-20 rounded-lg object-cover border" />
                  <button onClick={() => setHeroImage(null)} className="absolute -top-1 -right-1 rounded-full bg-destructive text-white w-5 h-5 text-xs flex items-center justify-center">x</button>
                </div>
              ) : (
                <ImageUpload folder="pulse" onUpload={setHeroImage} />
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setComposerOpen(false); resetComposer(); }}>Cancel</Button>
              <Button
                onClick={editingId ? handleUpdate : handleCreate}
                disabled={!content.trim() || createPost.isPending || updatePost.isPending}
              >
                {(createPost.isPending || updatePost.isPending) ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Saving...</>
                ) : editingId ? 'Update' : 'Publish'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
