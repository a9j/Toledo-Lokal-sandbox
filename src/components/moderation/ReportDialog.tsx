import { ReactNode, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Flag, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

type TargetType = 'pulse_post' | 'business' | 'review' | 'comment' | 'photo' | 'user' | 'event';

interface ReportDialogProps {
  targetType: TargetType;
  targetId: string;
  targetLabel?: string;
  trigger?: ReactNode;
}

const REPORT_REASONS = [
  'Spam or scam',
  'Inappropriate content',
  'Harassment or hate',
  'Misinformation',
  'Fake listing or reward',
  'Not actually local',
  'Other',
];

export function ReportDialog({ targetType, targetId, targetLabel, trigger }: ReportDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('not-signed-in');
      const { error } = await supabase.from('reports').insert({
        reporter_user_id: user.id,
        target_type: targetType,
        target_id: targetId,
        target_label: targetLabel ?? null,
        reason,
        details: details.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Report submitted — thank you for keeping Toledo Lokal safe.');
      setOpen(false);
      setReason('');
      setDetails('');
    },
    onError: (e: Error) => {
      if (e.message === 'not-signed-in') toast.error('Sign in to report content.');
      else toast.error('Could not submit report. Please try again.');
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <button className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <Flag className="h-3.5 w-3.5" /> Report
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Report this {targetType.replace('_', ' ')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-sm">Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue placeholder="Choose a reason" /></SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Details <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Add anything that helps our team review this." rows={3} maxLength={1000} />
          </div>
          <Button className="w-full" disabled={!reason || submit.isPending} onClick={() => submit.mutate()}>
            {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit report'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
