import { useQuery } from '@tanstack/react-query';
import { Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { siteUrl } from '@/lib/site-url';
import { Skeleton } from '@/components/ui/skeleton';
import { ContactQRCode } from '@/components/qr/ContactQRCode';
import { slugifyName } from '@/lib/vcard';

interface F25Row {
  id: string;
  name: string | null;
  slug: string | null;
}

// Admin-only board of printable contact QR codes, one per Founding 25 business.
// Scanning a code opens the public /save/:id page (save to contacts + profile).
export function FoundingContactCards() {
  const { data, isLoading } = useQuery({
    queryKey: ['founding-25-contact-qr'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses_public')
        .select('id, name, slug, tier_assigned_at')
        .eq('tier_status', 'founding_50')
        .order('tier_assigned_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as F25Row[];
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card p-10 text-center">
        <Shield className="mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">No Founding 25 businesses yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Assign businesses to the Founding 25 tier and their contact QR codes will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Each Founding 25 business has its own QR code. When a resident scans it, they can save the
        business to their phone contacts and open its Toledo Lokal profile. Download and print, or
        show it on your phone.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((b) => {
          const ref = b.slug ?? b.id;
          const url = siteUrl(`/save/${ref}`);
          return (
            <div
              key={b.id}
              className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm"
            >
              <p className="text-center text-sm font-semibold">{b.name ?? 'Toledo Business'}</p>
              <ContactQRCode url={url} filename={`${slugifyName(b.name ?? 'business')}-contact-qr.png`} />
              <p className="break-all text-center font-mono text-[10px] text-muted-foreground">{url}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
