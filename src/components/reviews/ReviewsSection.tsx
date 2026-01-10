import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { StarRating } from './StarRating';
import { ReviewCard } from './ReviewCard';
import { ReviewForm } from './ReviewForm';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, PenLine } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ReviewsSectionProps {
  businessId: string;
  businessOwnerId?: string;
  averageRating?: number;
  reviewCount?: number;
}

export function ReviewsSection({ businessId, businessOwnerId, averageRating = 0, reviewCount = 0 }: ReviewsSectionProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews', businessId],
    queryFn: async () => {
      const { data: reviewsData, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      // Fetch user profiles for reviews
      const userIds = [...new Set(reviewsData?.map(r => r.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      return reviewsData?.map(review => ({
        ...review,
        user: profileMap.get(review.user_id) || undefined
      })) || [];
    },
  });

  const { data: userReview } = useQuery({
    queryKey: ['user-review', businessId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('reviews')
        .select('id')
        .eq('business_id', businessId)
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const submitReviewMutation = useMutation({
    mutationFn: async ({ rating, title, content }: { rating: number; title: string; content: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase.from('reviews').insert({
        business_id: businessId,
        user_id: user.id,
        rating,
        title: title || null,
        content: content || null,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', businessId] });
      queryClient.invalidateQueries({ queryKey: ['user-review', businessId] });
      queryClient.invalidateQueries({ queryKey: ['business', businessId] });
      setIsDialogOpen(false);
      toast.success('Review submitted!');
    },
    onError: (error: any) => {
      const isRateLimit = error?.message?.includes('row-level security') || error?.code === '42501';
      if (isRateLimit) {
        toast.error('Slow down! You can only post 5 reviews per day, and new accounts must wait 1 hour before reviewing.');
      } else {
        toast.error('Failed to submit review');
      }
    },
  });

  const hasReviewed = !!userReview;
  const isBusinessOwner = user?.id === businessOwnerId;

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Reviews</h2>
          <div className="flex items-center gap-1.5">
            <StarRating rating={averageRating} size="sm" />
            <span className="text-sm text-muted-foreground">
              ({reviewCount})
            </span>
          </div>
        </div>

        {user && !hasReviewed && !isBusinessOwner && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-xl gap-2">
                <PenLine className="h-4 w-4" />
                Write Review
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Write a Review</DialogTitle>
              </DialogHeader>
              <ReviewForm 
                onSubmit={(review) => submitReviewMutation.mutate(review)}
                isSubmitting={submitReviewMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      ) : reviews && reviews.length > 0 ? (
        <div className="space-y-3">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-secondary/30 rounded-xl">
          <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">No reviews yet</p>
          {user && !hasReviewed && !isBusinessOwner && (
            <p className="text-sm text-muted-foreground mt-1">Be the first to review!</p>
          )}
        </div>
      )}
    </section>
  );
}
