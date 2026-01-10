import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, Clock, Loader2, Sparkles, Heart } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type ScanStatus = 'loading' | 'success' | 'pending' | 'paused' | 'already_earned';

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
      setResult({ status: 'paused', message: 'Loop rewards are paused — check back soon!' });
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
            title: `+${data.scan.points} Bonus Points!`,
            description: `Thanks for visiting ${data.scan.business?.name}`,
          });
        }
      } else if (data.paused) {
        // Graceful "paused" state - no error feeling
        setResult({ 
          status: 'paused', 
          message: data.error || 'Loop rewards are paused at this location — check back soon!'
        });
      } else if (data.alreadyEarned) {
        // Already earned - positive acknowledgment
        setResult({ 
          status: 'already_earned', 
          message: data.error || 'You\'ve already earned bonus points here — thanks for visiting!'
        });
      } else {
        // Unexpected case - still friendly
        setResult({ 
          status: 'paused', 
          message: 'Loop rewards are paused — check back soon!'
        });
      }
    } catch (error: any) {
      console.error('Scan error:', error);
      // Never show technical errors to customers
      setResult({ 
        status: 'paused', 
        message: 'Loop rewards are paused — check back soon!'
      });
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
                <h2 className="text-xl font-semibold mb-2">Checking for Bonus</h2>
                <p className="text-muted-foreground">One moment...</p>
              </div>
            )}

            {result.status === 'success' && (
              <div className="flex flex-col items-center text-center py-8">
                <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                  <Sparkles className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                  +{result.points} Bonus Points!
                </h2>
                <p className="text-muted-foreground mb-4">
                  Thanks for visiting {result.business?.name}
                </p>
                <p className="text-sm text-muted-foreground/70 mb-6">
                  Your community thanks you 🎉
                </p>
                <Button onClick={() => navigate('/loop-wallet')} className="w-full">
                  View My Wallet
                </Button>
              </div>
            )}

            {result.status === 'pending' && (
              <div className="flex flex-col items-center text-center py-8">
                <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                  <Clock className="h-10 w-10 text-amber-600 dark:text-amber-400" />
                </div>
                <h2 className="text-xl font-semibold mb-1">Almost There!</h2>
                <p className="text-muted-foreground mb-2">
                  {result.points} bonus points at {result.business?.name}
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  Show this screen to complete your visit
                </p>
                <div className="w-full p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 mb-4">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Points will be added once confirmed
                  </p>
                </div>
                <Button variant="outline" onClick={() => navigate('/loop-wallet')} className="w-full">
                  Go to Wallet
                </Button>
              </div>
            )}

            {result.status === 'paused' && (
              <div className="flex flex-col items-center text-center py-8">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Clock className="h-10 w-10 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Check Back Soon</h2>
                <p className="text-muted-foreground mb-6">{result.message}</p>
                <div className="flex gap-2 w-full">
                  <Button variant="outline" onClick={() => navigate('/')} className="flex-1">
                    Explore
                  </Button>
                  <Button onClick={() => navigate('/loop-wallet')} className="flex-1">
                    My Wallet
                  </Button>
                </div>
              </div>
            )}

            {result.status === 'already_earned' && (
              <div className="flex flex-col items-center text-center py-8">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Heart className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Thanks for Visiting!</h2>
                <p className="text-muted-foreground mb-6">{result.message}</p>
                <div className="flex gap-2 w-full">
                  <Button variant="outline" onClick={() => navigate('/')} className="flex-1">
                    Explore
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
