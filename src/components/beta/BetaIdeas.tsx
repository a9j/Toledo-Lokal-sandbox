import { useState } from 'react';
import { ChevronUp, MessageCircle, Lightbulb, Plus } from 'lucide-react';
import { useBetaIdeas, useIdeaComments, type IdeaSort, type BetaIdea } from '@/hooks/useBeta';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogoLoader } from '@/components/ui/logo-loader';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function IdeaComments({ ideaId }: { ideaId: string }) {
  const { comments, isLoading, add } = useIdeaComments(ideaId);
  const [body, setBody] = useState('');
  const { toast } = useToast();

  const submit = async () => {
    const text = body.trim();
    if (!text) return;
    setBody('');
    try {
      await add.mutateAsync(text);
    } catch {
      setBody(text);
      toast({ variant: 'destructive', title: 'Could not comment' });
    }
  };

  return (
    <div className="mt-3 space-y-3 border-t border-border/60 pt-3">
      {isLoading ? (
        <p className="text-xs text-muted-foreground">Loading...</p>
      ) : (
        comments.map((c) => (
          <div key={c.id} className="text-sm">
            <span className="font-medium">{c.author?.name ?? 'Member'}</span>
            <span className="ml-2 text-[11px] text-muted-foreground">{timeLabel(c.created_at)}</span>
            <p className="text-foreground/90">{c.body}</p>
          </div>
        ))
      )}
      <div className="flex gap-2">
        <Input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void submit(); } }}
          placeholder="Add a comment"
          maxLength={2000}
          className="h-9 text-sm"
        />
        <Button size="sm" variant="outline" onClick={submit} disabled={add.isPending || !body.trim()}>Post</Button>
      </div>
    </div>
  );
}

function IdeaCard({ idea, onToggleVote }: { idea: BetaIdea; onToggleVote: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="flex gap-3">
        <button
          onClick={() => onToggleVote(idea.id)}
          className={cn(
            'flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-xl border text-sm font-semibold transition-colors',
            idea.voted
              ? 'border-lokal-gold bg-lokal-gold/10 text-lokal-gold'
              : 'border-border text-muted-foreground hover:border-lokal-gold/50',
          )}
          aria-pressed={idea.voted}
        >
          <ChevronUp className="h-4 w-4" />
          {idea.vote_count}
        </button>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium leading-snug">{idea.title}</h3>
          {idea.description && (
            <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{idea.description}</p>
          )}
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            <span>{idea.author?.name ?? 'Member'}</span>
            <span>{timeLabel(idea.created_at)}</span>
            <button onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1 hover:text-foreground">
              <MessageCircle className="h-3.5 w-3.5" /> {idea.comment_count}
            </button>
          </div>
          {open && <IdeaComments ideaId={idea.id} />}
        </div>
      </div>
    </div>
  );
}

export function BetaIdeas() {
  const [sort, setSort] = useState<IdeaSort>('top');
  const { ideas, isLoading, submit, toggleVote } = useBetaIdeas(undefined, sort);
  const { toast } = useToast();
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const post = async () => {
    if (!title.trim()) return;
    try {
      await submit.mutateAsync({ title: title.trim(), description: description.trim() });
      setTitle('');
      setDescription('');
      setComposing(false);
      toast({ title: 'Idea posted', description: 'The cohort can upvote and comment.' });
    } catch {
      toast({ variant: 'destructive', title: 'Could not post idea' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button size="sm" variant={sort === 'top' ? 'default' : 'outline'} className="rounded-full text-xs" onClick={() => setSort('top')}>
            Most upvoted
          </Button>
          <Button size="sm" variant={sort === 'newest' ? 'default' : 'outline'} className="rounded-full text-xs" onClick={() => setSort('newest')}>
            Newest
          </Button>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setComposing((c) => !c)}>
          <Plus className="h-4 w-4" /> Idea
        </Button>
      </div>

      {composing && (
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Idea title"
            maxLength={160}
            className="mb-2"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={4000}
            placeholder="Describe what you'd like to see (optional)"
            className="w-full resize-none rounded-xl border border-input bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setComposing(false)}>Cancel</Button>
            <Button size="sm" onClick={post} disabled={submit.isPending || !title.trim()}>Post idea</Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10"><LogoLoader size="md" /></div>
      ) : ideas.length === 0 ? (
        <div className="py-10 text-center">
          <Lightbulb className="mx-auto mb-2 h-6 w-6 text-lokal-gold" />
          <p className="text-sm text-muted-foreground">No ideas yet. Post the first one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} onToggleVote={(id) => toggleVote.mutate(id)} />
          ))}
        </div>
      )}
    </div>
  );
}
