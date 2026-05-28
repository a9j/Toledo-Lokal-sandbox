import { PULSE_REACTIONS, PulseReactionType } from '@/lib/pulse-config';
import { useMyPulseReactions, useTogglePulseReaction } from '@/hooks/usePulseReactions';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PulsePost } from '@/hooks/usePulse';

interface ReactionBarProps {
  post: PulsePost;
}

export function ReactionBar({ post }: ReactionBarProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: myReactions } = useMyPulseReactions([post.id]);
  const toggle = useTogglePulseReaction();

  const mine = myReactions?.[post.id] || [];
  const counts = post.reaction_counts || {};

  const handleToggle = (type: PulseReactionType) => {
    if (!user) {
      toast({ title: 'Sign in to react' });
      return;
    }
    const active = mine.includes(type);
    toggle.mutate({ postId: post.id, reactionType: type, active });
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {PULSE_REACTIONS.map((reaction) => {
        const active = mine.includes(reaction.id);
        const count = counts[reaction.id] || 0;
        return (
          <button
            key={reaction.id}
            type="button"
            onClick={() => handleToggle(reaction.id)}
            aria-label={reaction.label}
            title={reaction.label}
            className={cn(
              'flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium transition-all active:scale-95',
              active
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
            )}
          >
            <span className="text-sm leading-none">{reaction.emoji}</span>
            {count > 0 && <span className="tabular-nums">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
