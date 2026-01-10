import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Clock, Check, X, User } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

export default function PendingScans() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pending scans for this business
  const { data: pendingScans, isLoading } = useQuery({
    queryKey: ['pending-scans', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get user's business
      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_user_id', user.id)
        .single();

      if (!business) return [];

      // Get pending scans for QR codes owned by this business
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

      // Get user profiles for each scan
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
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const confirmScan = useMutation({
    mutationFn: async (scanId: string) => {
      const { data, error } = await supabase.functions.invoke('loop-scan-qr', {
        body: { scanId, action: 'confirm' },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
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
    onError: (error: any) => {
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

  return (
    <>
      <Header title="Pending Scans" />
      <PageContainer className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Pending Confirmations</h1>
          <p className="text-sm text-muted-foreground">
            Confirm or reject customer QR code scans
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="h-24 bg-secondary animate-pulse rounded-xl" />
            ))}
          </div>
        ) : pendingScans?.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-1">No Pending Scans</h3>
              <p className="text-sm text-muted-foreground text-center">
                Customer scans requiring confirmation will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingScans?.map(scan => (
              <Card key={scan.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                      <User className="h-6 w-6 text-muted-foreground" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {scan.userProfile?.name || 'Customer'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {scan.qr_code?.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-primary">
                          {scan.qr_code?.points_value} pts
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(scan.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => rejectScan.mutate(scan.id)}
                        disabled={rejectScan.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        className="bg-green-600 hover:bg-green-700"
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

        <div className="pt-4">
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
