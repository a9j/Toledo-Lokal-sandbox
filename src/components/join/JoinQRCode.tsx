import { useEffect, useRef, useState } from 'react';
import QRCodeLib from 'qrcode';
import { Check, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface JoinQRCodeProps {
  /** Absolute URL the QR should encode. */
  url: string;
  /** Rendered pixel size of the QR (excludes the white card padding). */
  size?: number;
}

// Brand the code in lokal navy on white. Navy is near-black so contrast stays
// high enough to scan reliably, and a high error-correction level leaves room
// for the center logo without breaking the code.
const NAVY = '#0F1D35';
const LOGO_SRC = '/pwa-512x512.png';

// Reusable branded QR: navy-on-white with a centered logo, plus download and
// copy actions. Shared by the public /join/qr page and the admin console.
export function JoinQRCode({ url, size = 280 }: JoinQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    QRCodeLib.toCanvas(
      canvas,
      url,
      {
        width: size,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: { dark: NAVY, light: '#ffffff' },
      },
      (err) => {
        if (err) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw the brand mark in the center over a white quiet zone so the
        // surrounding modules keep scanning.
        const logo = new Image();
        logo.onload = () => {
          const badge = canvas.width * 0.22;
          const logoSize = canvas.width * 0.16;
          const cx = canvas.width / 2;
          const cy = canvas.height / 2;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          const r = badge / 2;
          // Rounded white square behind the logo.
          ctx.roundRect(cx - r, cy - r, badge, badge, 8);
          ctx.fill();
          ctx.drawImage(logo, cx - logoSize / 2, cy - logoSize / 2, logoSize, logoSize);
        };
        logo.src = LOGO_SRC;
      },
    );
  }, [url, size]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'toledolokal-join-qr.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard may be unavailable */
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="rounded-2xl bg-white p-5 shadow-soft-lg">
        <canvas ref={canvasRef} />
      </div>

      <p className="mt-5 break-all font-mono text-xs text-muted-foreground">{url}</p>

      <div className="mt-6 flex w-full max-w-xs flex-col gap-3">
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
      </div>
    </div>
  );
}
