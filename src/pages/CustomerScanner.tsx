import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, QrCode } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Html5Qrcode } from 'html5-qrcode';

export default function CustomerScanner() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const qrRef = useRef<Html5Qrcode | null>(null);
  const errorShownRef = useRef(false);
  const navigatedRef = useRef(false);

  const handleScan = useCallback(
    (decodedText: string) => {
      if (navigatedRef.current) return;
      try {
        const url = new URL(decodedText);
        const parts = url.pathname.split('/');
        const idx = parts.indexOf('scan');
        if (idx !== -1 && parts[idx + 1]) {
          navigatedRef.current = true;
          qrRef.current?.stop().catch(() => {});
          navigate(`/scan/${parts[idx + 1]}`);
        } else {
          if (!errorShownRef.current) {
            errorShownRef.current = true;
            setError('Not a Loop QR code. Try scanning another.');
            setTimeout(() => {
              setError(null);
              errorShownRef.current = false;
            }, 2500);
          }
        }
      } catch {
        if (!errorShownRef.current) {
          errorShownRef.current = true;
          setError('Could not read this QR code. Try again.');
          setTimeout(() => {
            setError(null);
            errorShownRef.current = false;
          }, 2500);
        }
      }
    },
    [navigate]
  );

  useEffect(() => {
    if (!user) return;

    const qr = new Html5Qrcode('customer-scanner-container');
    qrRef.current = qr;

    qr.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      handleScan,
      () => {}
    ).catch(() => {
      setCameraError(
        'Camera access required. Please allow camera permissions and try again.'
      );
    });

    return () => {
      qr.stop()
        .then(() => qr.clear())
        .catch(() => {});
    };
  }, [user, handleScan]);

  // Show blank while auth loads to avoid flash-navigate
  if (authLoading) return <div className="fixed inset-0 bg-black" />;

  if (!user) {
    sessionStorage.setItem('returnTo', '/scan-camera');
    navigate('/auth');
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Top bar */}
      <div className="relative z-20 flex items-center justify-between p-4 bg-black/60 backdrop-blur-sm">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-white font-semibold">Scan QR Code</span>
        <div className="w-10" />
      </div>

      {/* Scanner area */}
      <div className="flex-1 relative overflow-hidden">
        {cameraError ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 p-6 text-center">
            <QrCode className="h-16 w-16 text-white/40" />
            <p className="text-white/80 text-sm">{cameraError}</p>
          </div>
        ) : (
          <div id="customer-scanner-container" className="w-full h-full" />
        )}
      </div>

      {/* Hint text */}
      <div className="relative z-20 p-6 text-center bg-black/60 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-2 text-white/80 text-sm">
          <QrCode className="h-4 w-4" />
          Point your camera at a business QR code
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="absolute bottom-24 left-4 right-4 z-30 bg-destructive text-white text-sm font-medium px-4 py-3 rounded-xl text-center animate-fade-in-up">
          {error}
        </div>
      )}
    </div>
  );
}
