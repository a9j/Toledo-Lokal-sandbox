import { useState } from 'react';
import { Camera, BookOpen, Newspaper, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useEntityId, type EntityRef } from '@/hooks/useEntityFollow';
import { useEntityMemory, useAddMemory } from '@/hooks/useCityChange';

const KIND_ICON: Record<string, typeof Camera> = {
  photo: Camera,
  story: BookOpen,
  clipping: Newspaper,
};

const KINDS = [
  { value: 'story' as const, label: 'A story' },
  { value: 'photo' as const, label: 'A photo' },
  { value: 'clipping' as const, label: 'A clipping' },
];

interface CityMemoryProps {
  entityId?: string | null;
  source?: EntityRef;
  title?: string;
  className?: string;
}

/**
 * City Memory: what used to be here, on a timeline, oldest first.
 *
 * Anyone signed in can add one, and nothing appears until a person approves it.
 * The form says so, and it says the contributor's name will be shown, because
 * unlike a Fix Toledo report a memory is attributed on purpose.
 */
export function CityMemory({ entityId, source, title = 'City memory', className }: CityMemoryProps) {
  const { user } = useAuth();
  const resolved = useEntityId(entityId ? undefined : source);
  const id = entityId ?? resolved.data ?? null;

  const { data: items, isLoading, error } = useEntityMemory(id);
  const add = useAddMemory();

  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<'photo' | 'story' | 'clipping'>('story');
  const [year, setYear] = useState('');
  const [memoryTitle, setMemoryTitle] = useState('');
  const [body, setBody] = useState('');

  if (!id) return null;

  const submit = () => {
    if (!memoryTitle.trim()) {
      toast.error('Give it a short title.');
      return;
    }
    const parsedYear = year.trim() ? Number(year.trim()) : null;
    if (parsedYear !== null && (!Number.isInteger(parsedYear) || parsedYear < 1800 || parsedYear > 2100)) {
      toast.error('Use a four digit year, or leave it blank.');
      return;
    }
    add.mutate(
      { entityId: id, kind, title: memoryTitle.trim(), year: parsedYear, body: body.trim() || undefined },
      {
        onSuccess: () => {
          setOpen(false);
          setMemoryTitle('');
          setBody('');
          setYear('');
          toast.success('Thank you. Someone will read it before it goes up.');
        },
        onError: (e: Error) => toast.error(e.message || 'Could not save that.'),
      },
    );
  };

  return (
    <section className={className}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-heading text-base font-semibold">{title}</h2>
        {user && (
          <Button variant="ghost" size="sm" onClick={() => setOpen((v) => !v)}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add
          </Button>
        )}
      </div>

      {open && (
        <div className="mb-4 space-y-3 rounded-xl border border-border/60 bg-card p-4">
          <div className="flex gap-2">
            {KINDS.map((k) => (
              <button
                key={k.value}
                type="button"
                onClick={() => setKind(k.value)}
                className={
                  'flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ' +
                  (kind === k.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/60 bg-card hover:bg-muted/40')
                }
              >
                {k.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={year}
              onChange={(e) => setYear(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
              placeholder="Year"
              inputMode="numeric"
              className="w-24"
              aria-label="Year"
            />
            <Input
              value={memoryTitle}
              onChange={(e) => setMemoryTitle(e.target.value)}
              placeholder="What was here"
              aria-label="Title"
            />
          </div>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Tell it the way you remember it."
            rows={4}
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs leading-snug text-muted-foreground">
              Your name will show with this. Nothing goes up until someone reads it.
            </p>
            <Button onClick={submit} disabled={add.isPending} size="sm">
              {add.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Send
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-24 w-full rounded-xl" />
      ) : error ? (
        <p className="text-sm text-muted-foreground">
          Could not load the timeline. Check your connection and try again.
        </p>
      ) : !items || items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing here yet. {user ? 'Add the first one.' : 'Sign in to add the first one.'}
        </p>
      ) : (
        <ol className="relative space-y-4 border-l border-border/60 pl-5">
          {items.map((item) => {
            const Icon = KIND_ICON[item.kind] ?? BookOpen;
            return (
              <li key={item.id} className="relative">
                <span className="absolute -left-[1.6rem] flex h-5 w-5 items-center justify-center rounded-full border border-border/60 bg-card">
                  <Icon className="h-2.5 w-2.5 text-muted-foreground" />
                </span>
                <div className="flex items-baseline gap-2">
                  {item.year && (
                    <span className="font-heading text-sm font-semibold tabular-nums">
                      {item.year}
                    </span>
                  )}
                  <span className="text-sm font-medium">{item.title}</span>
                </div>
                {item.body && (
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                )}
                {item.contributor && (
                  <p className="mt-1 text-xs text-muted-foreground">Added by {item.contributor}</p>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
