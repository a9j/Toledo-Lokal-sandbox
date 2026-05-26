import { useState } from 'react';
import { toast } from 'sonner';
import { Check, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ComingSoonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export function ComingSoonModal({ open, onOpenChange }: ComingSoonModalProps) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      window.setTimeout(() => {
        setEmail('');
        setSubmitted(false);
        setSubmitting(false);
      }, 200);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email.trim())) {
      toast.error('Please enter a real email.');
      return;
    }

    setSubmitting(true);
    // Cast: the table is not in the generated Supabase types yet.
    const { error } = await supabase
      .from('today_waitlist' as never)
      .insert({ email: email.trim(), source: 'today_tab' } as never);

    setSubmitting(false);
    if (error) {
      toast.error('Something went wrong. Please try again.');
      return;
    }
    setSubmitted(true);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl">
        {submitted ? (
          <div className="flex flex-col items-center text-center py-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 mb-5">
              <Check className="h-7 w-7 text-emerald-500" strokeWidth={2.5} />
            </div>
            <h2 className="font-display text-xl font-semibold tracking-tight">You&rsquo;re on the list.</h2>
            <p className="mt-2 text-muted-foreground leading-relaxed">
              We&rsquo;ll let you know the moment Today goes live.
            </p>
            <Button onClick={() => handleOpenChange(false)} className="mt-6 rounded-full px-8">
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader className="space-y-2 text-center sm:text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-400/15">
                <Sparkles className="h-6 w-6 text-amber-500" />
              </div>
              <DialogTitle className="font-display text-2xl font-semibold tracking-tight">
                Today is coming soon
              </DialogTitle>
              <DialogDescription className="text-base leading-relaxed">
                Your daily look at Toledo is almost here. Drop your email and we&rsquo;ll tell you
                when it opens.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 space-y-3">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                autoComplete="email"
                className="h-12 rounded-full text-center"
              />
              <Button
                type="submit"
                disabled={submitting}
                className="h-12 w-full rounded-full text-base"
              >
                {submitting ? 'Saving...' : 'Notify me'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
