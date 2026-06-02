import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { QrCode, CheckCircle2, XCircle, Loader2, LogOut, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Html5QrcodeScanner } from 'html5-qrcode';

type ScanState = 'ready' | 'scanning' | 'success' | 'error';

interface ScanResult {
  points?: number;
  customerName?: string;
  message?: string;
}

export default function ScannerMode() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const businessId = searchParams.get('business');
  
  const [scanState, setScanState] = useState<ScanState>('ready');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if user has access to this business
  const { data: accessData, isLoading: checkingAccess } = useQuery({
    queryKey: ['staff-access', businessId, user?.id],
    queryFn: async (): Promise<{ access: boolean; businessName: string | null }> => {
      if (!businessId || !user) return { access: false, businessName: null };
      
      // Check if owner
      const { data: business } = await supabase
        .from('businesses')
        .select('id, name')
        .eq('id', businessId)
        .eq('owner_user_id', user.id)
        .maybeSingle();
      
      if (business) return { access: true, businessName: business.name };
      
      // Check if staff
      const { data: staff } = await supabase
        .from('business_staff')
        .select('id, businesses(name)')
        .eq('business_id', businessId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (staff) return { access: true, businessName: (staff.businesses as { name: string } | null)?.name ?? null };
      
      return { access: false, businessName: null };
    },
    enabled: !!businessId && !!user,
  });

  // Get user's businesses they have access to (for selection)
  const { data: accessibleBusinesses } = useQuery({
    queryKey: ['accessible-businesses', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Get owned businesses
      const { data: owned } = await supabase
        .from('businesses')
        .select('id, name')
        .eq('owner_user_id', user.id)
        .eq('status', 'approved');
      
      // Get staff businesses
      const { data: staffOf } = await supabase
        .from('business_staff')
        .select('business_id, businesses(id, name)')
        .eq('user_id', user.id);
      
      const staffBusinesses = staffOf?.map(s => s.businesses as { id: string; name: string } | null) || [];
      
      return [...(owned || []), ...staffBusinesses].filter(Boolean);
    },
    enabled: !!user && !businessId,
  });

  useEffect(() => {
    if (scanState !== 'scanning') return;

    const scanner = new Html5QrcodeScanner(
      'scanner-container',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      async (decodedText) => {
        scanner.clear();
        await handleScan(decodedText);
      },
      (error) => {
        // Ignore scan errors
      }
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [scanState]);

  const handleScan = async (qrData: string) => {
    if (isProcessing || !businessId) return;
    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('loop-scan-qr', {
        body: { qrData, businessId },
      });

      if (error) throw error;

      if (data.success) {
        setScanState('success');
        setScanResult({
          points: data.points,
          message: data.message || 'Points awarded!',
        });
      } else {
        setScanState('error');
        setScanResult({ message: data.error || 'Scan failed' });
      }
    } catch (err: unknown) {
      setScanState('error');
      setScanResult({ message: err instanceof Error ? err.message : 'Scan failed' });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScanner = () => {
    setScanState('ready');
    setScanResult(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <QrCode className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-xl font-semibold mb-2">Scanner Mode</h1>
        <p className="text-muted-foreground mb-6 text-center">Sign in to access the scanner</p>
        <Button onClick={() => navigate('/auth')}>Sign In</Button>
      </div>
    );
  }

  if (checkingAccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Business selection if no business specified
  if (!businessId) {
    return (
      <div className="min-h-screen bg-background flex flex-col p-6">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Select Business</h1>
        </div>

        {accessibleBusinesses && accessibleBusinesses.length > 0 ? (
          <div className="space-y-3">
            {accessibleBusinesses.map((business) => (
              <button
                key={business.id}
                onClick={() => navigate(`/scanner-mode?business=${business.id}`)}
                className="w-full p-4 rounded-xl border bg-card hover:bg-accent transition-colors text-left"
              >
                <p className="font-medium">{business.name}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <QrCode className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No businesses available</p>
          </div>
        )}

        <Button variant="outline" className="mt-auto gap-2" onClick={() => signOut()}>
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    );
  }

  if (!accessData?.access) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <XCircle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-xl font-semibold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6 text-center">
          You don't have permission to scan for this business
        </p>
        <Button variant="outline" onClick={() => navigate('/scanner-mode')}>
          Select Different Business
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - minimal */}
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Scanning for</p>
          <p className="font-semibold">{accessData.businessName}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/scanner-mode')}>
          Switch
        </Button>
      </div>

      {/* Main scanner area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {scanState === 'ready' && (
          <>
            <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center mb-8">
              <QrCode className="h-16 w-16 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Ready to Scan</h2>
            <p className="text-muted-foreground text-center mb-8">
              Tap below to scan a customer's QR code
            </p>
            <Button size="lg" className="text-lg px-12 py-6" onClick={() => setScanState('scanning')}>
              Start Scanning
            </Button>
          </>
        )}

        {scanState === 'scanning' && (
          <div className="w-full max-w-sm">
            <div id="scanner-container" className="rounded-xl overflow-hidden" />
            <Button variant="outline" className="w-full mt-4" onClick={resetScanner}>
              Cancel
            </Button>
          </div>
        )}

        {scanState === 'success' && (
          <>
            <div className="w-32 h-32 rounded-full bg-green-500/10 flex items-center justify-center mb-8 animate-in zoom-in-50 duration-300">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Success!</h2>
            {scanResult?.points && (
              <p className="text-4xl font-bold text-primary mb-2">
                +{scanResult.points} pts
              </p>
            )}
            <p className="text-muted-foreground text-center mb-8">
              {scanResult?.message}
            </p>
            <Button size="lg" className="text-lg px-12 py-6" onClick={resetScanner}>
              Scan Next
            </Button>
          </>
        )}

        {scanState === 'error' && (
          <>
            <div className="w-32 h-32 rounded-full bg-destructive/10 flex items-center justify-center mb-8 animate-in zoom-in-50 duration-300">
              <XCircle className="h-16 w-16 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold text-destructive mb-2">Scan Failed</h2>
            <p className="text-muted-foreground text-center mb-8">
              {scanResult?.message}
            </p>
            <Button size="lg" className="text-lg px-12 py-6" onClick={resetScanner}>
              Try Again
            </Button>
          </>
        )}
      </div>

      {/* Footer - Sign out */}
      <div className="p-4 border-t">
        <Button variant="ghost" className="w-full gap-2 text-muted-foreground" onClick={() => signOut()}>
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
