import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePendingVerifications } from '@/hooks/useCommunityDirectory';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  ShieldCheck,
  ShieldX,
  Heart,
  Clock,
} from 'lucide-react';

export function VerificationQueue() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: pending, isLoading } = usePendingVerifications();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const updateVerification = useMutation({
    mutationFn: async ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: 'approved' | 'rejected';
      notes?: string;
    }) => {
      const updates: Record<string, unknown> = {
        status: status,
      };
      if (notes) {
        updates.ownership_review_notes = notes;
      }

      const { error } = await supabase
        .from('businesses')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['pending-verifications'] });
      queryClient.invalidateQueries({ queryKey: ['community-directory'] });
      toast({
        title: status === 'approved' ? 'Approved' : 'Rejected',
        description:
          status === 'approved'
            ? 'Organization is now visible in the Community directory.'
            : 'Organization has been rejected.',
      });
      setRejectingId(null);
      setRejectReason('');
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update verification status.',
      });
    },
  });

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  }

  if (!pending?.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-green-500" />
        <p className="font-medium">No pending verifications</p>
        <p className="text-sm">All community applications have been reviewed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            Verification Queue
          </h2>
          <p className="text-sm text-muted-foreground">
            {pending.length} pending application{pending.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {pending.map((org) => (
          <div key={org.id} className="card-elevated p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{org.name}</h3>
                  <span className="inline-flex items-center text-[10px] border rounded px-1.5 py-0.5">
                    <Heart className="h-3 w-3 mr-1" /> Nonprofit
                  </span>
                </div>
                {org.neighborhood && (
                  <p className="text-xs text-muted-foreground mb-1">
                    {(org.neighborhood as { name: string }).name}
                  </p>
                )}
                {org.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {org.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                className="gap-1"
                onClick={() =>
                  updateVerification.mutate({ id: org.id, status: 'approved' })
                }
                disabled={updateVerification.isPending}
              >
                <ShieldCheck className="h-4 w-4" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1 text-destructive hover:text-destructive"
                onClick={() => setRejectingId(org.id)}
                disabled={updateVerification.isPending}
              >
                <ShieldX className="h-4 w-4" />
                Reject
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Reject dialog */}
      <Dialog
        open={!!rejectingId}
        onOpenChange={(open) => {
          if (!open) {
            setRejectingId(null);
            setRejectReason('');
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reason (optional)</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Why is this application being rejected?"
                rows={3}
              />
            </div>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => {
                if (rejectingId) {
                  updateVerification.mutate({
                    id: rejectingId,
                    status: 'rejected',
                    notes: rejectReason || undefined,
                  });
                }
              }}
              disabled={updateVerification.isPending}
            >
              Confirm Rejection
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
