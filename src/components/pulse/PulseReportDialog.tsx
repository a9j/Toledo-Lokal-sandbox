import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { PULSE_REPORT_REASONS } from '@/lib/pulse-config';
import { useReportPulsePost } from '@/hooks/usePulseReports';
import { useToast } from '@/hooks/use-toast';

interface PulseReportDialogProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PulseReportDialog({ postId, open, onOpenChange }: PulseReportDialogProps) {
  const [reason, setReason] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const report = useReportPulsePost();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!reason) return;
    try {
      await report.mutateAsync({ postId, reason, note: note.trim() || undefined });
      toast({ title: 'Thanks for keeping Pulse local', description: 'Our moderators will take a look.' });
      onOpenChange(false);
      setReason(null);
      setNote('');
    } catch {
      toast({ variant: 'destructive', title: 'Could not submit report' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border-border">
        <DialogHeader>
          <DialogTitle>Report this post</DialogTitle>
          <DialogDescription>
            Pulse stays clean and local. Tell us what's wrong and a moderator will review it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2">
            {PULSE_REPORT_REASONS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setReason(r.id)}
                className={cn(
                  'rounded-lg border px-3 py-2 text-left text-sm transition-all',
                  reason === r.id ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-secondary'
                )}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div>
            <Label className="mb-1.5 block text-sm">Add a note (optional)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={280}
              placeholder="Anything our moderators should know?"
              className="h-20 resize-none"
            />
          </div>

          <Button onClick={handleSubmit} disabled={!reason || report.isPending} className="w-full">
            {report.isPending ? 'Submitting…' : 'Submit report'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
