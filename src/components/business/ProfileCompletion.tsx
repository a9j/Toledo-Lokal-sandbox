import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileCompletionInput {
  hasCover: boolean;
  hasLogo: boolean;
  photoCount: number;
  hasStory: boolean;
  hasHours: boolean;
}

interface ChecklistItem {
  label: string;
  done: boolean;
  required?: boolean;
}

function buildChecklist(input: ProfileCompletionInput): ChecklistItem[] {
  return [
    { label: 'Cover photo', done: input.hasCover, required: true },
    { label: 'Logo', done: input.hasLogo, required: true },
    { label: 'Add 3+ photos (interior, product, team, community)', done: input.photoCount >= 3 },
    { label: 'Write your Lokal Story', done: input.hasStory },
    { label: 'Set your hours', done: input.hasHours },
  ];
}

/**
 * "Complete your profile" progress. Cover + Logo are required; the rest are
 * encouraged. Reduces onboarding friction (don't force all six photo slots) by
 * showing progress instead of blocking.
 */
export function ProfileCompletion(props: ProfileCompletionInput) {
  const items = buildChecklist(props);
  const done = items.filter((i) => i.done).length;
  const pct = Math.round((done / items.length) * 100);
  const remaining = items.filter((i) => !i.done);

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Complete your profile</h3>
        <span className="text-sm font-medium text-muted-foreground">{pct}%</span>
      </div>

      <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="space-y-1.5">
        {items.map((item) => (
          <li
            key={item.label}
            className={cn(
              'flex items-center gap-2 text-sm',
              item.done ? 'text-muted-foreground line-through' : 'text-foreground'
            )}
          >
            {item.done ? (
              <Check className="h-4 w-4 flex-shrink-0 text-primary" />
            ) : (
              <Circle className="h-4 w-4 flex-shrink-0 text-muted-foreground/50" />
            )}
            <span>{item.label}</span>
            {!item.done && item.required && (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                Required
              </span>
            )}
          </li>
        ))}
      </ul>

      {remaining.length === 0 && (
        <p className="mt-2 text-xs font-medium text-primary">🎉 Your profile is complete!</p>
      )}
    </div>
  );
}
