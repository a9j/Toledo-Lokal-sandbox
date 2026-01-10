import { useEffect, useRef, useState } from 'react';
import QRCodeLib from 'qrcode';
import { QrCode, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLoop } from '@/contexts/LoopContext';
import { cn } from '@/lib/utils';

interface UserWalletQRProps {
  className?: string;
}

export function UserWalletQR({ className }: UserWalletQRProps) {
  const { wallet } = useLoop();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // The wallet ID is the user's identity for redemption
  const walletQRData = wallet ? `loop-wallet:${wallet.id}` : '';

  useEffect(() => {
    if (canvasRef.current && walletQRData && isExpanded) {
      QRCodeLib.toCanvas(canvasRef.current, walletQRData, {
        width: 180,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
    }
  }, [walletQRData, isExpanded]);

  if (!wallet) return null;

  return (
    <div className={cn("bg-card rounded-2xl border shadow-sm overflow-hidden", className)}>
      <Button
        variant="ghost"
        className="w-full flex items-center justify-between p-4 h-auto hover:bg-muted/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <QrCode className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="font-medium text-foreground">My Loop ID</p>
            <p className="text-xs text-muted-foreground">Show to redeem rewards</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </Button>

      {isExpanded && (
        <div className="px-4 pb-4 flex flex-col items-center gap-3 animate-in slide-in-from-top-2 duration-200">
          <div className="bg-white p-3 rounded-xl shadow-sm">
            <canvas ref={canvasRef} />
          </div>
          <p className="text-xs text-muted-foreground text-center max-w-[200px]">
            Staff will scan this to confirm your reward redemption
          </p>
        </div>
      )}
    </div>
  );
}
