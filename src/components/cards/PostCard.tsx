import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Share2, Bookmark, Send } from 'lucide-react';

interface PostCardProps {
  post: {
    id: string;
    content: string;
    post_type: string;
    featured?: boolean | null;
    pinned?: boolean | null;
    likes_count: number;
    comments_count: number;
    created_at: string;
    author?: {
      user_id?: string;
      name?: string | null;
      avatar_url?: string | null;
    } | null;
    business?: {
      id: string;
      name: string;
    } | null;
  };
}

export function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const { data: isLiked } = useQuery({
    queryKey: ['post-like', post.id, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  const { data: isSaved } = useQuery({
    queryKey: ['saved-post', post.id, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from('saved_items')
        .select('id')
        .eq('user_id', user.id)
        .eq('item_type', 'post')
        .eq('item_id', post.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  const { data: comments } = useQuery({
    queryKey: ['post-comments', post.id],
    queryFn: async () => {
      const { data: commentsData, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', post.id)
        .eq('status', 'active')
        .order('created_at', { ascending: true });
      
      if (error) throw error;

      // Fetch author profiles separately
      const authorIds = [...new Set(commentsData.map(c => c.author_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', authorIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return commentsData.map(comment => ({
        ...comment,
        author: profileMap.get(comment.author_id) || null,
      }));
    },
    enabled: showComments,
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Must be logged in');
      
      if (isLiked) {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('post_likes')
          .insert({ post_id: post.id, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-like', post.id] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Must be logged in');
      
      if (isSaved) {
        const { error } = await supabase
          .from('saved_items')
          .delete()
          .eq('user_id', user.id)
          .eq('item_type', 'post')
          .eq('item_id', post.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('saved_items')
          .insert({ user_id: user.id, item_type: 'post', item_id: post.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-post', post.id] });
      toast({ title: isSaved ? 'Removed from saved' : 'Saved!' });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error('Must be logged in');
      
      const { error } = await supabase
        .from('comments')
        .insert({ post_id: post.id, author_id: user.id, content });
      if (error) throw error;
    },
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['post-comments', post.id] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this post on Toledo Hub',
          text: post.content.substring(0, 100),
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link copied!' });
    }
  };

  const authorName = post.business?.name || post.author?.name || 'Anonymous';
  const authorInitial = authorName.charAt(0).toUpperCase();

  return (
    <div className="card-elevated p-4">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={post.author?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {authorInitial}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {post.business ? (
              <Link to={`/business/${post.business.id}`} className="font-semibold hover:underline">
                {post.business.name}
              </Link>
            ) : (
              <span className="font-semibold">{authorName}</span>
            )}
            {post.pinned && (
              <Badge variant="secondary" className="text-[10px]">Pinned</Badge>
            )}
            {post.featured && (
              <Badge variant="secondary" className="bg-warning/10 text-warning text-[10px]">Featured</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Content */}
      <p className="text-foreground whitespace-pre-wrap mb-4">{post.content}</p>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className={`gap-1.5 ${isLiked ? 'text-destructive' : ''}`}
            onClick={() => likeMutation.mutate()}
            disabled={!user || likeMutation.isPending}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-xs">{post.likes_count}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs">{post.comments_count}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        {user && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
          </Button>
        )}
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-border space-y-3">
          {comments?.map(comment => (
            <div key={comment.id} className="flex gap-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs bg-secondary">
                  {comment.author?.name?.charAt(0)?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-secondary rounded-xl px-3 py-2">
                <p className="text-xs font-medium">{comment.author?.name || 'Anonymous'}</p>
                <p className="text-sm">{comment.content}</p>
              </div>
            </div>
          ))}

          {user ? (
            <div className="flex gap-2">
              <Textarea
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="min-h-[40px] text-sm"
                rows={1}
              />
              <Button
                size="icon"
                disabled={!commentText.trim() || commentMutation.isPending}
                onClick={() => commentMutation.mutate(commentText)}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Link to="/auth">
              <Button variant="outline" size="sm" className="w-full">
                Sign in to comment
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
