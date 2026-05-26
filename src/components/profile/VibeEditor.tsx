import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Coffee, BookOpen, Music, Sparkles, Utensils, Wine, Trees, Palette,
  Users, Trophy, ShoppingBag, Camera, Check,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const VIBE_OPTIONS: { label: string; icon: typeof Coffee }[] = [
  { label: 'Coffee Shops', icon: Coffee },
  { label: 'Bookstores', icon: BookOpen },
  { label: 'Live Music', icon: Music },
  { label: 'Hidden Gems', icon: Sparkles },
  { label: 'Foodie', icon: Utensils },
  { label: 'Nightlife', icon: Wine },
  { label: 'Outdoors', icon: Trees },
  { label: 'Arts & Culture', icon: Palette },
  { label: 'Family Spots', icon: Users },
  { label: 'Sports', icon: Trophy },
  { label: 'Shopping', icon: ShoppingBag },
  { label: 'Photo Spots', icon: Camera },
];

const iconFor = (label: string) =>
  VIBE_OPTIONS.find((o) => o.label === label)?.icon ?? Sparkles;

interface VibeEditorProps {
  userId: string;
  vibe: string[];
}

export function VibeEditor({ userId, vibe }: VibeEditorProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(vibe);

  const save = useMutation({
    mutationFn: async (next: string[]) => {
      // `vibe` is not yet in the generated Supabase types; cast the payload.
      const { error } = await supabase
        .from('profiles')
        .update({ vibe: next } as never)
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      setOpen(false);
      toast.success('Vibe updated');
    },
    onError: (error) => {
      console.error('Failed to update vibe', error);
      toast.error('Could not save your vibe. Please try again.');
    },
  });

  const openEditor = () => {
    setDraft(vibe);
    setOpen(true);
  };

  const toggle = (label: string) =>
    setDraft((prev) =>
      prev.includes(label) ? prev.filter((v) => v !== label) : [...prev, label]
    );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-foreground/90">Your Vibe</h3>
        <button onClick={openEditor} className="text-xs text-primary font-semibold">Edit</button>
      </div>
      <p className="text-sm text-muted-foreground">The things you love most about Toledo.</p>

      {vibe.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {vibe.map((label) => {
            const Icon = iconFor(label);
            return (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold"
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </span>
            );
          })}
        </div>
      ) : (
        <button
          onClick={openEditor}
          className="text-sm text-primary font-medium"
        >
          + Add your vibe
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Your Vibe</DialogTitle>
            <DialogDescription>Pick the things you love most about Toledo.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-2 py-2">
            {VIBE_OPTIONS.map(({ label, icon: Icon }) => {
              const selected = draft.includes(label);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggle(label)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
                    selected
                      ? 'bg-primary/10 border-primary/40 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  {selected ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                  {label}
                </button>
              );
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">
              Cancel
            </Button>
            <Button
              onClick={() => save.mutate(draft)}
              disabled={save.isPending}
              className="rounded-full"
            >
              {save.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
