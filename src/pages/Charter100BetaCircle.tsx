import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import {
  MessageSquare,
  Lightbulb,
  Lock,
  Send,
  ChevronUp,
  MessageCircle,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCircleMembership, useCircleChat, useCircleIdeas } from '@/hooks/useCircle';
import { useIdeaComments, type IdeaSort, type BetaIdea } from '@/hooks/useBeta';
import { useCohort } from '@/hooks/useCohort';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SEOHead } from '@/components/seo/SEOHead';
import { LogoLoader } from '@/components/ui/logo-loader';
import { Charter100Badge } from '@/components/charter100/Charter100Badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const SLUG = 'charter100-beta';

function initials(name: string | null): string {
  if (!name) return 'TL';
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

function timeLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function dateLabelShort(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function CircleChat() {
  const { posts, isLoading, send } = useCircleChat(SLUG);
  const { toast } = useToast();
  const [body, setBody] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [posts.length]);

  const submit = async () => {
    const text = body.trim();
    if (!text) return;
    setBody('');
    try {
      await send.mutateAsync(text);
    } catch {
      setBody(text);
      toast({ variant: 'destructive', title: 'Could not send', description: 'Please try again.' });
    }
  };

  return (
    <div className="flex flex-col">
      {isLoading ? (
        <div className="flex justify-center py-10"><LogoLoader size="md" /></div>
      ) : posts.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No messages yet. Say hello and kick things off.
        </p>
      ) : (
        <div className="space-y-4 pb-4">
          {posts.map((p) => (
            <div key={p.id} className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={p.author?.avatar_url ?? undefined} />
                <AvatarFallback className="text-[11px]">{initials(p.author?.name ?? null)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">{p.author?.name ?? 'Member'}</span>
                  <span className="text-[11px] text-muted-foreground">{timeLabel(p.created_at)}</span>
                </div>
                <p className="whitespace-pre-line break-words text-sm text-foreground/90">{p.body}</p>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      )}

      <div className="sticky bottom-0 mt-2 flex items-end gap-2 border-t border-border/60 bg-background pt-3">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
          rows={1}
          maxLength={4000}
          placeholder="Message the cohort"
          className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-input bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button size="icon" className="h-11 w-11 shrink-0" onClick={submit} disabled={send.isPending || !body.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
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
            <span className="ml-2 text-[11px] text-muted-foreground">{dateLabelShort(c.created_at)}</span>
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
            <span>{dateLabelShort(idea.created_at)}</span>
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

function CircleIdeas() {
  const [sort, setSort] = useState<IdeaSort>('top');
  const { ideas, isLoading, submit, toggleVote } = useCircleIdeas(SLUG, sort);
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

export default function Charter100BetaCircle() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: isMember, isLoading: memberLoading } = useCircleMembership(SLUG);
  const { cohort } = useCohort('charter-100');

  if (authLoading || memberLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LogoLoader size="lg" />
      </div>
    );
  }

  if (!user || !isMember) {
    return (
      <div className="min-h-screen bg-background text-foreground antialiased">
        <Header showBack />
        <SEOHead title="Charter 100 Circle" url="/circles/charter100-beta" noindex />
        <div className="mx-auto flex min-h-[80svh] max-w-md flex-col items-center justify-center px-6 text-center">
          <Lock className="mb-4 h-10 w-10 text-muted-foreground" />
          <h1 className="font-display text-2xl font-semibold tracking-tight">Charter 100 members only</h1>
          <p className="mt-3 text-sm font-light leading-relaxed text-muted-foreground">
            This space is for the founding 100 residents. If you have an invite, join at the Charter 100 page first.
          </p>
          {!user ? (
            <Button asChild variant="secondary" className="mt-6 rounded-full">
              <Link to="/auth">Sign in</Link>
            </Button>
          ) : (
            <Button asChild variant="secondary" className="mt-6 rounded-full">
              <Link to="/charter-100">Go to Charter 100</Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <Header showBack />
      <SEOHead title="Charter 100 Circle" url="/circles/charter100-beta" noindex />
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <header className="text-center">
          <div className="mb-3 flex justify-center">
            <Charter100Badge variant="full" />
          </div>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
            {cohort?.name ?? 'Charter 100'}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm font-light leading-relaxed text-muted-foreground">
            {cohort?.mission ?? 'The founding 100 residents shaping what comes next.'}
          </p>
        </header>

        <Tabs defaultValue="chat" className="mt-8">
          <TabsList className="w-full">
            <TabsTrigger value="chat" className="flex-1 gap-1.5">
              <MessageSquare className="h-4 w-4" /> Chat
            </TabsTrigger>
            <TabsTrigger value="ideas" className="flex-1 gap-1.5">
              <Lightbulb className="h-4 w-4" /> Ideas
            </TabsTrigger>
          </TabsList>
          <TabsContent value="chat" className="pt-4"><CircleChat /></TabsContent>
          <TabsContent value="ideas" className="pt-4"><CircleIdeas /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
