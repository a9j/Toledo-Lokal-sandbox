import { useEffect, useRef } from 'react';
import QRCodeLib from 'qrcode';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ContactQRCodeProps {
  /** Absolute URL the QR should encode (e.g. a /save/:id contact link). */
  url: string;
  /** Filename used when the PNG is downloaded. */
  filename: string;
  /** Rendered pixel size of the QR (excludes the white card padding). */
  size?: number;
}

// Match the on-brand navy used by the join QR so printed codes look consistent.
const NAVY = '#0F1D35';

// Compact branded QR plus a download action. Used in the admin console to print
// one card per Founding 25 business.
export function ContactQRCode({ url, filename, size = 200 }: ContactQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    QRCodeLib.toCanvas(canvas, url, {
      width: size,
      margin: 2,
      color: { dark: NAVY, light: '#ffffff' },
    });
  }, [url, size]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="rounded-xl bg-white p-3 shadow-sm">
        <canvas ref={canvasRef} />
      </div>
      <Button variant="outline" size="sm" onClick={handleDownload} className="w-full rounded-full">
        <Download className="mr-2 h-4 w-4" />
        Download
      </Button>
    </div>
  );
}
