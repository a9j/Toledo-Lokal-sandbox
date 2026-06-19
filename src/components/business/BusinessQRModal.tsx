import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Share2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { businessQrUrl } from '@/lib/business-qr';
import { shareLink } from '@/lib/native-share';

interface BusinessQRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  businessName: string;
}

// A centered modal that shows the business's permanent QR code. The code is
// generated client-side from the /qr/:businessId URL, so there is no backend
// call to render it. The Share button reuses the same URL.
export function BusinessQRModal({ open, onOpenChange, businessId, businessName }: BusinessQRModalProps) {
  const [qrImage, setQrImage] = useState<string | null>(null);
  const url = businessQrUrl(businessId);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setQrImage(null);
    QRCode.toDataURL(url, { width: 480, margin: 1, errorCorrectionLevel: 'M' })
      .then((dataUrl) => { if (active) setQrImage(dataUrl); })
      .catch(() => { if (active) setQrImage(null); });
    return () => { active = false; };
  }, [open, url]);

  const handleShare = () => {
    shareLink({
      title: businessName,
      text: `View ${businessName} on Toledo Lokal and save our contact`,
      url,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs rounded-3xl sm:max-w-sm">
        <DialogTitle className="text-center text-lg font-bold text-foreground">
          {businessName}
        </DialogTitle>

        <div className="flex flex-col items-center gap-4">
          <div className="flex h-60 w-60 items-center justify-center rounded-2xl bg-white p-3">
            {qrImage ? (
              <img
                src={qrImage}
                alt={`QR code for ${businessName}`}
                width={240}
                height={240}
                className="h-full w-full"
              />
            ) : (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            )}
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Scan to view {businessName} and save our contact
          </p>

          <Button onClick={handleShare} className="h-11 w-full gap-2 rounded-full text-sm font-semibold">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
