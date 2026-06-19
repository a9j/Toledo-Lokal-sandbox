import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Share2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { businessQrUrl } from '@/lib/business-qr';
import { shareLink } from '@/lib/native-share';
import { ensureContactCard, updateContactTitle } from '@/lib/contact-cards';

interface BusinessQRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  businessName: string;
  userId: string;
  personName: string;
  personEmail: string | null;
}

// A centered modal that shows the person's permanent QR code for a business. The
// code is generated client-side from the /qr/:businessId URL and carries the
// person's contact card (?c=), so a scan files the saved contact under them with
// the business as their company. The title is editable here.
export function BusinessQRModal({
  open, onOpenChange, businessId, businessName, userId, personName, personEmail,
}: BusinessQRModalProps) {
  const [cardId, setCardId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [qrImage, setQrImage] = useState<string | null>(null);

  // Ensure the person has a card (refreshing their name/email) when the modal
  // opens, and load any title they already set.
  useEffect(() => {
    if (!open) return;
    let active = true;
    setQrImage(null);
    setCardId(null);
    ensureContactCard(businessId, userId, personName, personEmail).then((card) => {
      if (!active) return;
      setCardId(card?.id ?? null);
      setTitle(card?.title ?? '');
    });
    return () => { active = false; };
  }, [open, businessId, userId, personName, personEmail]);

  // The QR encodes the card when we have one, otherwise the business alone.
  const url = businessQrUrl(businessId, cardId);

  useEffect(() => {
    if (!open) return;
    let active = true;
    QRCode.toDataURL(url, { width: 480, margin: 1, errorCorrectionLevel: 'M' })
      .then((dataUrl) => { if (active) setQrImage(dataUrl); })
      .catch(() => { if (active) setQrImage(null); });
    return () => { active = false; };
  }, [open, url]);

  const saveTitle = () => {
    if (cardId) updateContactTitle(cardId, title);
  };

  const handleShare = () => {
    saveTitle();
    shareLink({
      title: businessName,
      text: `View ${businessName} on Toledo Lokal and save my contact`,
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
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">{personName}</p>
            {title.trim() && <p className="text-xs text-muted-foreground">{title.trim()}</p>}
          </div>

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
            Scan to view {businessName} and save my contact
          </p>

          <div className="w-full space-y-1.5 text-left">
            <Label htmlFor="qr-title" className="text-xs text-muted-foreground">
              Your title (optional)
            </Label>
            <Input
              id="qr-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              placeholder="e.g. Owner, Manager, CEO"
              maxLength={80}
              disabled={!cardId}
            />
            <p className="text-[11px] text-muted-foreground">
              Shown when people save your contact.
            </p>
          </div>

          <Button onClick={handleShare} className="h-11 w-full gap-2 rounded-full text-sm font-semibold">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
