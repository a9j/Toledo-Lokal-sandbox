import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useCohortChat } from '@/hooks/useBeta';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogoLoader } from '@/components/ui/logo-loader';
import { useToast } from '@/hooks/use-toast';

// Lightweight group chat for the Founding Beta Circle. Reads/writes are gated to
// active beta members by RLS; this just renders the thread and a composer.
function initials(name: string | null): string {
  if (!name) return 'TL';
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

function timeLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function BetaChat() {
  const { posts, isLoading, send } = useCohortChat();
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
