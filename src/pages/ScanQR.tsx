import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QrCode, Check, AlertCircle, Loader2, Clock } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type ScanStatus = 'loading' | 'success' | 'pending' | 'error';

interface ScanResult {
  status: ScanStatus;
  points?: number;
  business?: { id: string; name: string; logo_url?: string };
  qrName?: string;
  message?: string;
  requiresConfirmation?: boolean;
}

export default function ScanQR() {
  const { qrCodeId } = useParams<{ qrCodeId: string }>();
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [result, setResult] = useState<ScanResult>({ status: 'loading' });

  useEffect(() => {
    if (!qrCodeId) {
      setResult({ status: 'error', message: 'Invalid QR code' });
      return;
    }

    if (!user || !session) {
      // Save the scan URL to redirect back after login
      sessionStorage.setItem('pendingScan', qrCodeId);
      navigate('/auth');
      return;
    }

    processScan();
  }, [qrCodeId, user, session]);

  const processScan = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('loop-scan-qr', {
        body: { qrCodeId, action: 'scan' },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data.success) {
        setResult({
          status: data.scan.requiresConfirmation ? 'pending' : 'success',
          points: data.scan.points,
          business: data.scan.business,
          qrName: data.scan.qrName,
          requiresConfirmation: data.scan.requiresConfirmation,
        });

        if (!data.scan.requiresConfirmation) {
          toast({
            title: `+${data.scan.points} Loop Points!`,
            description: `Earned at ${data.scan.business?.name}`,
          });
        }
      } else {
        setResult({ status: 'error', message: data.error || 'Scan failed' });
      }
    } catch (error: any) {
      console.error('Scan error:', error);
      const errorMessage = error.message || 'Failed to process scan';
      setResult({ status: 'error', message: errorMessage });
    }
  };

  return (
    <>
      <Header title="Loop Points" />
      <PageContainer className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-sm">
          <CardContent className="p-6">
            {result.status === 'loading' && (
              <div className="flex flex-col items-center text-center py-8">
                <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
                <h2 className="text-xl font-semibold mb-2">Processing Scan</h2>
                <p className="text-muted-foreground">Please wait...</p>
              </div>
            )}

            {result.status === 'success' && (
              <div className="flex flex-col items-center text-center py-8">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <Check className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-green-600 mb-1">
                  +{result.points} Points!
                </h2>
                <p className="text-muted-foreground mb-4">
                  Earned at {result.business?.name}
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  {result.qrName}
                </p>
                <Button onClick={() => navigate('/loop-wallet')} className="w-full">
                  View My Wallet
                </Button>
              </div>
            )}

            {result.status === 'pending' && (
              <div className="flex flex-col items-center text-center py-8">
                <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                  <Clock className="h-10 w-10 text-amber-600" />
                </div>
                <h2 className="text-xl font-semibold mb-1">Awaiting Confirmation</h2>
                <p className="text-muted-foreground mb-2">
                  {result.points} points pending at {result.business?.name}
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  Show this screen to staff for confirmation
                </p>
                <div className="w-full p-4 bg-amber-50 rounded-xl border border-amber-200 mb-4">
                  <p className="text-sm font-medium text-amber-800">
                    Points will be added once staff confirms
                  </p>
                </div>
                <Button variant="outline" onClick={() => navigate('/loop-wallet')} className="w-full">
                  Go to Wallet
                </Button>
              </div>
            )}

            {result.status === 'error' && (
              <div className="flex flex-col items-center text-center py-8">
                <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <AlertCircle className="h-10 w-10 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Scan Failed</h2>
                <p className="text-muted-foreground mb-6">{result.message}</p>
                <div className="flex gap-2 w-full">
                  <Button variant="outline" onClick={() => navigate('/')} className="flex-1">
                    Go Home
                  </Button>
                  <Button onClick={() => navigate('/loop-wallet')} className="flex-1">
                    My Wallet
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </PageContainer>
    </>
  );
}
