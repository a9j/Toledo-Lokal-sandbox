import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Clock, Check, X, User, CheckCheck, RotateCw } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export default function PendingScans() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: pendingScans, isLoading } = useQuery({
    queryKey: ['pending-scans', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_user_id', user.id)
        .single();

      if (!business) return [];

      const { data, error } = await supabase
        .from('loop_qr_scans')
        .select(`
          *,
          qr_code:loop_qr_codes!inner(id, name, points_value, business_id)
        `)
        .eq('qr_code.business_id', business.id)
        .eq('status', 'pending_confirmation')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const userIds = [...new Set(data?.map(s => s.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return data?.map(scan => ({
        ...scan,
        userProfile: profileMap.get(scan.user_id),
      })) || [];
    },
    enabled: !!user,
    refetchInterval: 10000,
  });

  const confirmScan = useMutation({
    mutationFn: async (scanId: string) => {
      const { data, error } = await supabase.functions.invoke('loop-scan-qr', {
        body: { scanId, action: 'confirm' },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast({ title: data.message || 'Points issued successfully' });
      queryClient.invalidateQueries({ queryKey: ['pending-scans'] });
      queryClient.invalidateQueries({ queryKey: ['business-loop-stats'] });
    },
    onError: (error: Error) => {
      toast({ title: error.message || 'Failed to confirm', variant: 'destructive' });
    },
  });

  const rejectScan = useMutation({
    mutationFn: async (scanId: string) => {
      const { error } = await supabase
        .from('loop_qr_scans')
        .update({ status: 'rejected' })
        .eq('id', scanId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Scan rejected' });
      queryClient.invalidateQueries({ queryKey: ['pending-scans'] });
    },
    onError: () => {
      toast({ title: 'Failed to reject', variant: 'destructive' });
    },
  });

  const handleBatchConfirm = async () => {
    if (!pendingScans?.length) return;
    for (const scan of pendingScans) {
      await confirmScan.mutateAsync(scan.id).catch(() => {});
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['pending-scans'] });
    setIsRefreshing(false);
  };

  const pendingCount = pendingScans?.length || 0;

  return (
    <>
      <Header title="Pending Scans" />
      <PageContainer className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Pending Confirmations</h1>
            <p className="text-sm text-muted-foreground">
              {pendingCount > 0
                ? `${pendingCount} scan${pendingCount !== 1 ? 's' : ''} awaiting confirmation`
                : 'No pending scans'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RotateCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
        </div>

        {/* Batch confirm */}
        {pendingCount > 1 && (
          <Button
            variant="outline"
            className="w-full gap-2 border-success/30 text-success hover:bg-success/10"
            onClick={handleBatchConfirm}
            disabled={confirmScan.isPending}
          >
            <CheckCheck className="h-4 w-4" />
            Confirm All ({pendingCount})
          </Button>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-24 bg-secondary animate-pulse rounded-xl" />
            ))}
          </div>
        ) : pendingCount === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-1">All Clear</h3>
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                No customer scans waiting. New scans will appear here automatically.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pendingScans?.map(scan => (
              <Card key={scan.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <User className="h-6 w-6 text-muted-foreground" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {scan.userProfile?.name || 'Customer'}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {scan.qr_code?.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-primary text-xs">
                          {scan.qr_code?.points_value} pts
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(scan.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-10 w-10 text-destructive hover:bg-destructive/10 border-destructive/20"
                        onClick={() => rejectScan.mutate(scan.id)}
                        disabled={rejectScan.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        className="h-10 w-10 bg-success hover:bg-success/90 text-success-foreground"
                        onClick={() => confirmScan.mutate(scan.id)}
                        disabled={confirmScan.isPending}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="pt-2">
          <Link to="/dashboard/qr-codes">
            <Button variant="outline" className="w-full">
              Manage QR Codes
            </Button>
          </Link>
        </div>
      </PageContainer>
    </>
  );
}
