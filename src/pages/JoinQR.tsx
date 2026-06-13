import { useEffect, useRef, useState } from 'react';
import QRCodeLib from 'qrcode';
import { Link } from 'react-router-dom';
import { Check, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/seo/SEOHead';
import { siteUrl } from '@/lib/site-url';
import { CITY } from '@/lib/city';

// Unlisted helper page: pull this up on a phone (or print it) to show a QR
// that opens the public /join page. Points at the production URL via siteUrl
// so the code is correct even when viewed from a Vercel preview deploy.
const JOIN_URL = siteUrl('/join');

export default function JoinQR() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCodeLib.toCanvas(canvasRef.current, JOIN_URL, {
      width: 280,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });
  }, []);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'toledolokal-join-qr.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JOIN_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard may be unavailable */
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <SEOHead title="Founding Partner QR" url="/join/qr" noindex />

      <section className="safe-area-pad-top flex min-h-[100svh] flex-col items-center justify-center px-6 py-12 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lokal-gold">
          {CITY.name} Founding Partners
        </p>
        <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Scan to learn more
        </h1>
        <p className="mt-2 max-w-sm text-sm font-light leading-relaxed text-muted-foreground">
          Point a phone camera at this code to open the Founding Partner page.
        </p>

        <div className="mt-8 rounded-2xl bg-white p-5 shadow-soft-lg">
          <canvas ref={canvasRef} />
        </div>

        <p className="mt-5 break-all font-mono text-xs text-muted-foreground">{JOIN_URL}</p>

        <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
          <Button onClick={handleDownload} className="h-11 rounded-full font-semibold">
            <Download className="mr-2 h-4 w-4" />
            Download QR
          </Button>
          <Button
            variant="outline"
            onClick={handleCopy}
            className="h-11 rounded-full font-semibold"
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Link copied
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy link
              </>
            )}
          </Button>
          <Link
            to="/join"
            className="mt-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Open the page
          </Link>
        </div>
      </section>
    </div>
  );
}
