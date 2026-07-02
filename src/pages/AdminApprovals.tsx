import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Building2, X, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { LogoLoader } from '@/components/ui/logo-loader';

interface PendingClaim {
  id: string;
  claimant_user_id: string;
  claimed_role: string;
  created_at: string;
  claimant_email?: string;
  claimant_name?: string;
}

async function fetchPendingClaims(): Promise<PendingClaim[]> {
  const { data, error } = await supabase
    .from('pending_claims')
    .select('id, claimant_user_id, claimed_role, created_at')
    .eq('status', 'pending')
    .in('claimed_role', ['resident', 'business'])
    .order('created_at', { ascending: true });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  const userIds = data.map((c) => c.claimant_user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, name, email')
    .in('user_id', userIds);

  const profileMap = new Map(
    (profiles || []).map((p) => [p.user_id, p]),
  );

  return data.map((c) => {
    const profile = profileMap.get(c.claimant_user_id);
    return {
      ...c,
      claimant_name: profile?.name || undefined,
      claimant_email: profile?.email || undefined,
    };
  });
}

export default function AdminApprovals() {
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [actingOn, setActingOn] = useState<string | null>(null);

  const { data: claims, isLoading } = useQuery({
    queryKey: ['admin-pending-claims'],
    queryFn: fetchPendingClaims,
    enabled: !!user && isAdmin,
  });

  const approveMutation = useMutation({
    mutationFn: async ({ claimId, role }: { claimId: string; role: string }) => {
      const { error } = await supabase.rpc('approve_claim' as never, {
        p_claim_id: claimId,
        p_role: role,
      } as never);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      toast.success(`Approved as ${variables.role}`);
      queryClient.invalidateQueries({ queryKey: ['admin-pending-claims'] });
      setActingOn(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Could not approve. Try again.');
      setActingOn(null);
    },
  });

  const declineMutation = useMutation({
    mutationFn: async (claimId: string) => {
      const { error } = await supabase.rpc('decline_business_claim' as never, {
        p_claim_id: claimId,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Declined');
      queryClient.invalidateQueries({ queryKey: ['admin-pending-claims'] });
      setActingOn(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Could not decline. Try again.');
      setActingOn(null);
    },
  });

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LogoLoader size="lg" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth', { replace: true });
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="font-display text-xl font-semibold">Access denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">You need admin access to view this page.</p>
      </div>
    );
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="safe-area-pad-top sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate('/admin')}
            className="-ml-1.5 flex h-11 w-11 items-center justify-center rounded-lg hover:bg-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-display text-lg font-bold tracking-tight">Approvals</h1>
            <p className="text-xs text-muted-foreground">
              {claims?.length ?? 0} pending
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4 pb-[calc(9rem+env(safe-area-inset-bottom))]">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LogoLoader size="md" />
          </div>
        ) : !claims || claims.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-muted-foreground">No pending requests right now.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {claims.map((claim) => {
              const isBusy = actingOn === claim.id;
              const requestedResident = claim.claimed_role === 'resident';

              return (
                <div
                  key={claim.id}
                  className="rounded-xl border border-border bg-card p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {claim.claimant_name || 'No name'}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {claim.claimant_email || claim.claimant_user_id.slice(0, 8)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-secondary px-2 py-0.5">
                      {requestedResident ? (
                        <User className="h-3 w-3 text-muted-foreground" />
                      ) : (
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {claim.claimed_role}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    Signed up {formatDate(claim.created_at)}
                  </p>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="h-9 flex-1 gap-1.5 text-xs"
                      disabled={isBusy}
                      onClick={() => {
                        setActingOn(claim.id);
                        approveMutation.mutate({
                          claimId: claim.id,
                          role: requestedResident ? 'resident' : 'business',
                        });
                      }}
                    >
                      {isBusy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      {requestedResident ? 'Approve Resident' : 'Approve Business'}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 gap-1.5 text-xs"
                      disabled={isBusy}
                      onClick={() => {
                        setActingOn(claim.id);
                        approveMutation.mutate({
                          claimId: claim.id,
                          role: requestedResident ? 'business' : 'resident',
                        });
                      }}
                    >
                      {requestedResident ? 'As Business' : 'As Resident'}
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-9 px-2 text-destructive hover:text-destructive"
                      disabled={isBusy}
                      onClick={() => {
                        setActingOn(claim.id);
                        declineMutation.mutate(claim.id);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
