import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Contact, ExternalLink, MapPin, Phone, Globe, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { SecureImage } from '@/components/ui/secure-image';
import { siteUrl } from '@/lib/site-url';
import { downloadVCard } from '@/lib/vcard';
import tlLogo from '@/assets/tl-logo.png';

const isUUID = (v: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

// Public, no-auth landing page reached by scanning a founding business's QR
// code. It lets anyone save the business to their phone contacts (vCard) and
// jump to the full Toledo Lokal profile.
export default function SaveContact() {
  const { id } = useParams<{ id: string }>();

  const { data: business, isLoading, isError } = useQuery({
    queryKey: ['save-contact', id],
    enabled: !!id,
    queryFn: async () => {
      const base = supabase
        .from('businesses_public')
        .select(
          'id, name, slug, logo_url, cover_image_url, profile_picture_url, phone, website, address, neighborhood_id',
        );
      const { data, error } = await (isUUID(id!) ? base.eq('id', id) : base.eq('slug', id)).single();
      if (error) throw error;

      let neighborhood: string | null = null;
      if (data.neighborhood_id) {
        const { data: nb } = await supabase
          .from('neighborhoods')
          .select('name')
          .eq('id', data.neighborhood_id)
          .maybeSingle();
        neighborhood = nb?.name ?? null;
      }
      return { ...data, neighborhood };
    },
  });

  useEffect(() => {
    document.title = business?.name ? `Save ${business.name} · Toledo Lokal` : 'Toledo Lokal';
  }, [business?.name]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !business) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <img src={tlLogo} alt="ToledoLokal" className="h-16 w-auto" />
        <h1 className="text-xl font-bold">Business not found</h1>
        <p className="text-sm text-muted-foreground">
          This contact link may have expired or been removed.
        </p>
        <Link to="/">
          <Button variant="outline" className="rounded-full">Go to Toledo Lokal</Button>
        </Link>
      </div>
    );
  }

  const ref = business.slug ?? business.id;
  const heroPath = business.cover_image_url || business.profile_picture_url || business.logo_url;
  const logoPath = business.logo_url || business.profile_picture_url;

  const handleSave = () => {
    downloadVCard({
      name: business.name ?? 'Toledo Business',
      phone: business.phone,
      website: business.website,
      address: business.address,
      profileUrl: siteUrl(`/business/${ref}`),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-10 safe-area-pad-top">
        {/* Brand bar */}
        <div className="flex items-center justify-center py-5">
          <img src={tlLogo} alt="ToledoLokal" className="h-9 w-auto" />
        </div>

        <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
          {/* Hero */}
          <div className="relative h-36 bg-secondary">
            {heroPath && (
              <SecureImage
                storagePath={heroPath}
                alt=""
                priority
                blurUp={false}
                imgClassName="object-cover"
                className="h-full w-full"
              />
            )}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-card" />
          </div>

          {/* Identity */}
          <div className="-mt-10 px-5 pb-5">
            <div className="h-20 w-20 overflow-hidden rounded-2xl border-4 border-card bg-secondary ring-1 ring-border/50">
              {logoPath ? (
                <SecureImage
                  storagePath={logoPath}
                  alt={business.name ?? ''}
                  blurUp={false}
                  imgClassName="object-cover"
                  className="h-full w-full"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Contact className="h-7 w-7 text-muted-foreground" />
                </div>
              )}
            </div>

            <h1 className="mt-3 text-xl font-bold tracking-tight text-foreground">
              {business.name ?? 'Toledo Business'}
            </h1>
            {business.neighborhood && (
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> {business.neighborhood}, Toledo
              </p>
            )}

            {/* Details */}
            <div className="mt-4 space-y-2">
              {business.address && (
                <div className="flex items-start gap-2 text-sm text-foreground/80">
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <span>{business.address}</span>
                </div>
              )}
              {business.phone && (
                <a href={`tel:${business.phone}`} className="flex items-center gap-2 text-sm text-foreground/80">
                  <Phone className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <span>{business.phone}</span>
                </a>
              )}
              {business.website && (
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary"
                >
                  <Globe className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{business.website.replace(/^https?:\/\//, '')}</span>
                </a>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 space-y-3">
              <Button onClick={handleSave} className="h-12 w-full rounded-full text-base font-semibold">
                <Contact className="mr-2 h-5 w-5" />
                Save to Contacts
              </Button>
              <Link to={`/business/${ref}`} className="block">
                <Button variant="outline" className="h-12 w-full rounded-full text-base font-medium">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View full profile
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          A Toledo Lokal founding business
        </p>
      </div>
    </div>
  );
}
