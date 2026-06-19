import { useQuery } from '@tanstack/react-query';
import { QrCode } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { siteUrl } from '@/lib/site-url';
import { slugifyName } from '@/lib/vcard';
import { useEffectiveBusinessRole } from '@/hooks/useEffectiveBusinessRole';
import { isOwnerOrAdmin } from '@/lib/businessPermissions';
import { ContactQRCode } from '@/components/qr/ContactQRCode';
import { Skeleton } from '@/components/ui/skeleton';

interface OwnerContactQRCardProps {
  businessId: string;
}

// Owner/admin-only "digital business card". Renders the business's contact QR
// (encoding the public /save/:id flow) inside the management console so an owner
// can pull it up and let people scan it in person. It is intentionally NOT shown
// on the public /business/:slug profile.
export function OwnerContactQRCard({ businessId }: OwnerContactQRCardProps) {
  // Gate on effective role: 'owner' (via owner_user_id) or 'admin' (platform
  // admin). Managers/staff who can reach /manage must not see this.
  const { data: role } = useEffectiveBusinessRole(businessId);

  const { data: business, isLoading } = useQuery({
    queryKey: ['owner-contact-qr', businessId],
    enabled: !!businessId && isOwnerOrAdmin(role),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses_public')
        .select('id, name, slug')
        .eq('id', businessId)
        .single();
      if (error) throw error;
      return data as { id: string; name: string | null; slug: string | null };
    },
  });

  if (!isOwnerOrAdmin(role)) return null;

  if (isLoading || !business) {
    return <Skeleton className="h-80 w-full max-w-xs rounded-2xl" />;
  }

  const ref = business.slug ?? business.id;
  const url = siteUrl(`/save/${ref}`);

  return (
    <div className="card-elevated p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-secondary">
          <QrCode className="h-5 w-5 text-foreground" />
        </div>
        <div>
          <h3 className="font-display text-base font-bold tracking-tight">Your contact QR</h3>
          <p className="text-sm text-muted-foreground">
            Show this in person — scanning it lets someone save you to their contacts and open your
            profile. Works like a digital business card.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col items-center gap-3">
        <div className="w-full max-w-xs">
          <ContactQRCode
            url={url}
            filename={`${slugifyName(business.name ?? 'business')}-contact-qr.png`}
            size={240}
          />
        </div>
        <p className="break-all text-center font-mono text-[10px] text-muted-foreground">{url}</p>
      </div>
    </div>
  );
}
