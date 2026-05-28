import { formatDistanceToNow } from 'date-fns';
import { StarRating } from './StarRating';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReportDialog } from '@/components/moderation/ReportDialog';

interface Review {
  id: string;
  rating: number;
  title?: string;
  content?: string;
  photos?: string[];
  helpful_count: number;
  created_at: string;
  user?: {
    name?: string;
    avatar_url?: string;
  };
}

interface ReviewCardProps {
  review: Review;
  onHelpful?: (reviewId: string) => void;
}

export function ReviewCard({ review, onHelpful }: ReviewCardProps) {
  const userName = review.user?.name || 'Anonymous';
  const initials = userName.slice(0, 2).toUpperCase();

  return (
    <div className="p-4 rounded-xl bg-secondary/50 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{userName}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        <StarRating rating={review.rating} size="sm" />
      </div>

      {/* Content */}
      {review.title && (
        <h4 className="font-medium">{review.title}</h4>
      )}
      {review.content && (
        <p className="text-sm text-foreground/90 leading-relaxed">{review.content}</p>
      )}

      {/* Photos */}
      {review.photos && review.photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto py-1">
          {review.photos.map((photo, index) => (
            <img
              key={index}
              src={photo}
              alt={`Review photo ${index + 1}`}
              className="h-20 w-20 rounded-lg object-cover flex-shrink-0"
            />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground gap-1.5"
          onClick={() => onHelpful?.(review.id)}
        >
          <ThumbsUp className="h-4 w-4" />
          Helpful ({review.helpful_count})
        </Button>
        <ReportDialog targetType="review" targetId={review.id} targetLabel={`Review by ${userName}`} />
      </div>
    </div>
  );
}
