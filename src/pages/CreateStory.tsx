import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNeighborhoods } from '@/hooks/useNeighborhoods';
import { useCreateStory } from '@/hooks/useStories';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function CreateStory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: neighborhoods } = useNeighborhoods();
  const createStory = useCreateStory();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [storyType, setStoryType] = useState('tip');
  const [neighborhoodId, setNeighborhoodId] = useState('');

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createStory.mutateAsync({
        title,
        content,
        story_type: storyType,
        neighborhood_id: neighborhoodId || undefined,
      });
      toast.success('Story submitted! It will appear after review.');
      navigate('/stories');
    } catch (error) {
      toast.error('Failed to submit story');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-[calc(9rem+env(safe-area-inset-bottom))]">
      <Header title="Share Your Story" />

      <form onSubmit={handleSubmit} className="px-4 py-6 space-y-6">
        <div>
          <label className="text-sm font-medium mb-2 block">Story Type</label>
          <Select value={storyType} onValueChange={setStoryType}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tip">💡 Local Tip</SelectItem>
              <SelectItem value="hidden_gem">💎 Hidden Gem</SelectItem>
              <SelectItem value="memory">📸 Toledo Memory</SelectItem>
              <SelectItem value="recommendation">⭐ Recommendation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Title *</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your story a catchy title"
            className="rounded-xl"
            maxLength={100}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Your Story *</label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your tip, discovery, or memory..."
            className="rounded-xl min-h-[150px]"
            maxLength={1000}
          />
          <p className="text-xs text-muted-foreground mt-1">{content.length}/1000</p>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Neighborhood (optional)</label>
          <Select value={neighborhoodId} onValueChange={setNeighborhoodId}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Select a neighborhood" />
            </SelectTrigger>
            <SelectContent>
              {neighborhoods?.map((n) => (
                <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="submit"
          className="w-full rounded-xl h-12"
          disabled={createStory.isPending}
        >
          {createStory.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Story'
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Stories are reviewed before being published to ensure quality.
        </p>
       </form>
    </div>
  );
}
