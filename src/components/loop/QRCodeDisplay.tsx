import { useEffect, useRef } from 'react';
import QRCodeLib from 'qrcode';
import { Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface QRCodeDisplayProps {
  qrCodeId: string;
  pointsValue: number;
  size?: number;
}

export function QRCodeDisplay({ qrCodeId, pointsValue, size = 200 }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Create the scan URL - this will be scanned by users
  const scanUrl = `${window.location.origin}/scan/${qrCodeId}`;

  useEffect(() => {
    if (canvasRef.current) {
      QRCodeLib.toCanvas(canvasRef.current, scanUrl, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
    }
  }, [scanUrl, size]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = `loop-qr-${qrCodeId.slice(0, 8)}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
    
    toast({ title: 'QR code downloaded' });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Loop Points QR Code',
          text: `Scan to earn ${pointsValue} Loop Points!`,
          url: scanUrl,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(scanUrl);
      toast({ title: 'Link copied to clipboard' });
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <canvas ref={canvasRef} />
      </div>
      
      <div className="text-center">
        <p className="text-2xl font-bold text-primary">{pointsValue} pts</p>
        <p className="text-sm text-muted-foreground">per scan</p>
      </div>

      <div className="flex gap-2 w-full">
        <Button variant="outline" className="flex-1" onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        <Button variant="outline" className="flex-1" onClick={handleShare}>
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Print this QR code or share it with customers
      </p>
    </div>
  );
}
