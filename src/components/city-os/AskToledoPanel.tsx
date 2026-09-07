import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Loader2, ChevronRight, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FollowButton } from '@/components/city-os/FollowButton';
import {
  useAskToledo,
  askCardPath,
  askCardSubtitle,
  type AskCard,
} from '@/hooks/useAskToledo';

interface AskToledoPanelProps {
  /** Pins every question to one neighborhood. */
  neighborhoodId?: string | null;
  neighborhoodName?: string | null;
  suggestions?: string[];
  placeholder?: string;
  compact?: boolean;
  /**
   * Prefills the box, for links that arrive with a question in the URL.
   * It is not submitted automatically: a question costs the asker one of
   * thirty a day, so pressing ask stays their decision.
   */
  initialQuestion?: string;
}

const CITY_SUGGESTIONS = [
  'Build my Saturday',
  'Where can I get coffee near me',
  'What is on this week',
  'Who is hiring right now',
  'Where can I get help with food',
  'What is being built near me',
  'Where can I rent a small shop',
];

function CardRow({ card }: { card: AskCard }) {
  const href = askCardPath(card);
  const title = card.name ?? card.title ?? 'Untitled';
  const subtitle = askCardSubtitle(card);
  const blurb = card.description ?? card.mission ?? card.body ?? null;

  const inner = (
    <div className="flex items-start gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold">{title}</p>
          {card.is_free && (
            <Badge variant="secondary" className="text-[10px]">
              Free
            </Badge>
          )}
        </div>
        {subtitle && (
          <p className="mt-0.5 truncate text-xs capitalize text-muted-foreground">{subtitle}</p>
        )}
        {blurb && (
          <p className="mt-1 line-clamp-2 text-sm leading-snug text-muted-foreground">{blurb}</p>
        )}
      </div>
      {href && <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
    </div>
  );

  return (
    <div className="rounded-xl border border-border/60 bg-card p-3.5">
      {href ? (
        <Link to={href} className="block transition-opacity hover:opacity-80">
          {inner}
        </Link>
      ) : (
        inner
      )}
      <div className="mt-3">
        <FollowButton entityId={card.entity_id} size="sm" variant="outline" />
      </div>
    </div>
  );
}

/**
 * Ask Toledo.
 *
 * Used full width on its own page and pinned to one neighborhood on a
 * neighborhood page. The answer always comes with the cards it was built from,
 * so a resident can check the source rather than take the sentence on trust.
 */
export function AskToledoPanel({
  neighborhoodId,
  neighborhoodName,
  suggestions,
  placeholder,
  compact,
  initialQuestion,
}: AskToledoPanelProps) {
  const [question, setQuestion] = useState(initialQuestion ?? '');
  const [asked, setAsked] = useState<string | null>(null);
  const ask = useAskToledo();

  const run = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setAsked(trimmed);
    ask.mutate({ question: trimmed, neighborhoodId, neighborhoodName });
  };

  const prompts = suggestions ?? CITY_SUGGESTIONS;

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(question);
        }}
        className="space-y-2"
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={
              placeholder ??
              (neighborhoodName ? `Ask about ${neighborhoodName}` : 'Ask anything about Toledo')
            }
            className={compact ? 'pl-9' : 'h-12 pl-9 text-base'}
            maxLength={500}
            aria-label="Your question"
          />
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={!question.trim() || ask.isPending}
        >
          {ask.isPending ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-1.5 h-4 w-4" />
          )}
          Ask
        </Button>
      </form>

      {!ask.data && !ask.isPending && !ask.error && (
        <div className="flex flex-wrap gap-2">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => {
                setQuestion(prompt);
                run(prompt);
              }}
              className="rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:border-border hover:bg-muted/40"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {ask.isPending && (
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-sm text-muted-foreground">Looking through Toledo...</p>
        </div>
      )}

      {ask.error && (
        <div className="rounded-xl border border-border/60 bg-muted/50 p-4">
          <p className="text-sm">{ask.error.message}</p>
        </div>
      )}

      {ask.data && (
        <div className="space-y-4">
          {asked && (
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {asked}
            </p>
          )}

          <div className="rounded-xl border border-border/60 bg-card p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{ask.data.answer}</p>
          </div>

          {ask.data.cards.length > 0 && (
            <div className="space-y-2">
              {ask.data.cards.map((card) => (
                <CardRow key={`${card.bucket}-${card.entity_id}`} card={card} />
              ))}
            </div>
          )}

          {/* An answer with nothing behind it is worth saying out loud, so
              nobody mistakes a polite sentence for a real result. */}
          {!ask.data.found_anything && ask.data.cards.length === 0 && (
            <p className="text-xs leading-snug text-muted-foreground">
              Nothing in Toledo Lokal matched this yet. Ask Toledo only answers from what
              is listed here, so it will say so rather than guess.
            </p>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => {
              ask.reset();
              setQuestion('');
              setAsked(null);
            }}
          >
            Ask something else
          </Button>
        </div>
      )}
    </div>
  );
}
