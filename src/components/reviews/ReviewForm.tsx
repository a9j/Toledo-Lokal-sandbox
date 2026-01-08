import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { StarRating } from './StarRating';
import { Loader2 } from 'lucide-react';

interface ReviewFormProps {
  onSubmit: (review: { rating: number; title: string; content: string }) => void;
  isSubmitting?: boolean;
}

export function ReviewForm({ onSubmit, isSubmitting = false }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    onSubmit({ rating, title, content });
  };

  const isValid = rating > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Your Rating</label>
        <StarRating
          rating={rating}
          size="lg"
          interactive
          onChange={setRating}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Title (optional)</label>
        <Input
          placeholder="Summarize your experience"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-xl"
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Your Review (optional)</label>
        <Textarea
          placeholder="Share your experience..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="rounded-xl min-h-[100px] resize-none"
        />
      </div>

      <Button 
        type="submit" 
        className="w-full rounded-xl"
        disabled={!isValid || isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Submitting...
          </>
        ) : (
          'Submit Review'
        )}
      </Button>
    </form>
  );
}
