import { Bookmark, Share2, MapPin, Shield, Sparkles, Radio, Store, ArrowLeft, Settings, Contact } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SecureImage } from '@/components/ui/secure-image';
import { cn } from '@/lib/utils';
import { downloadVCard } from '@/lib/vcard';
import { siteUrl } from '@/lib/site-url';
import { getOpenStatus } from '@/lib/business-hours';
import { useBusinessLocations } from '@/hooks/useBusinessLocations';
import { ResolvedAction } from '@/lib/business-profile-config';
import { ProfileBusiness } from './profile-types';
import { Chip, ProfileCard } from './ProfilePrimitives';
import { TierLabel } from '@/components/business/TierBadge';

interface ProfileHeroProps {
  business: ProfileBusiness;
  liveStatus: string;
  primary: ResolvedAction | null;
  isSaved: boolean;
  /** True for the owner or a manager — anyone who can administer this business. */
  canManage: boolean;
  onSave: () => void;
  onShare: () => void;
  /** Person who shared this page (from a scanned QR), filed into the saved card. */
  contactCard?: { name: string | null; title: string | null; email: string | null } | null;
}

export function ProfileHero({ business, liveStatus, primary, isSaved, canManage, onSave, onShare, contactCard }: ProfileHeroProps) {
  const heroImage = business.cover_image_url || business.photos?.[0] || null;
  // Base the open/closed badge on the primary location's hours when locations
  // exist — a single business-level schedule is misleading for multi-location
  // businesses. Falls back to business-level hours for businesses that haven't
  // split out locations.
  const { data: locations } = useBusinessLocations(business.id);
  const activeLocations = (locations ?? []).filter((l) => l.is_active);
  const primaryLocation = activeLocations.find((l) => l.is_primary) ?? activeLocations[0];
  const status = getOpenStatus(primaryLocation?.hours ?? business.hours);
  const tagline = business.description?.split('\n')[0]?.trim();

  // Save the business straight to the phone's contacts as a vCard. This works
  // with no account and no app install, so it is never gated. The contact's
  // website points at the Toledo Lokal business page.
  const handleSaveContact = () => {
    const profileUrl = siteUrl(`/business/${business.slug ?? business.id}`);
    downloadVCard({
      name: business.name,
      phone: business.phone,
      website: profileUrl,
      address: business.address,
      contactName: contactCard?.name,
      contactTitle: contactCard?.title,
      email: contactCard?.email,
    });
  };

  return (
    <section>
      {/* Image header */}
      <div className="relative h-52 w-full overflow-hidden bg-gradient-to-br from-primary/15 via-secondary to-background sm:h-60">
        {heroImage ? (
          <SecureImage storagePath={heroImage} alt={business.name} className="h-full w-full" imgClassName="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Store className="h-14 w-14 text-primary/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

        {/* Back / Manage overlay. The outer wrapper carries the top safe-area
            inset (status bar / notch / Dynamic Island) so the controls never
            sit behind the phone display; the inner row keeps the normal
            padding on web where the inset resolves to 0. */}
        <div className="absolute inset-x-0 top-0 safe-area-pad-top">
          <div className="flex items-center justify-between p-3">
            <Link
              to="/explore"
              className="inline-flex items-center gap-1 rounded-full bg-background/80 px-3 py-1.5 text-sm font-medium text-foreground shadow-sm backdrop-blur-md hover:bg-background"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            {canManage && (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1.5 text-sm font-medium text-foreground shadow-sm backdrop-blur-md hover:bg-background"
              >
                <Settings className="h-4 w-4" />
                Manage
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Overlapping content */}
      <div className="relative -mt-12 px-4">
        <div className="flex items-end gap-3">
          {/* Logo card */}
          <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border-2 border-background bg-card shadow-lg">
            {business.logo_url ? (
              <SecureImage storagePath={business.logo_url} alt={`${business.name} logo`} className="h-full w-full object-contain p-1.5" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary/10">
                <Store className="h-7 w-7 text-primary" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 pb-1">
            {status && (
              <span
                className={cn(
                  'mb-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                  status.isOpen ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', status.isOpen ? 'bg-success' : 'bg-muted-foreground')} />
                {status.label}
              </span>
            )}
          </div>
        </div>

        {/* Name + founding badge */}
        <div className="mt-3 flex items-start gap-2">
          <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-foreground">{business.name}</h1>
          {business.isFoundingMember && (
            <span className="mt-1 inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 border border-amber-400/50 px-2 py-0.5 text-[10px] font-bold text-amber-950">
              <Shield className="h-3 w-3 fill-current" /> Founding 5
            </span>
          )}
          {!business.isFoundingMember && business.tierStatus === 'founding_50' && (
            <span className="mt-1 inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-gradient-to-r from-slate-400 to-slate-300 border border-slate-300/50 px-2 py-0.5 text-[10px] font-bold text-slate-900">
              <Shield className="h-3 w-3 fill-current" /> Founding 25
            </span>
          )}
        </div>

        {tagline && <p className="mt-1 text-sm text-muted-foreground">{tagline}</p>}

        {business.tierStatus && (business.tierStatus === 'founding_5' || business.tierStatus === 'founding_50') && (
          <div className="mt-1">
            <TierLabel tier={business.tierStatus} assignedAt={business.tierAssignedAt} />
          </div>
        )}

        {/* Chips */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {business.category?.name && <Chip>{business.category.name}</Chip>}
          {business.neighborhood?.name && <Chip icon={MapPin}>{business.neighborhood.name}</Chip>}
          <Chip tone="primary">Locally owned</Chip>
          <Chip tone="success" icon={Sparkles}>Active this week</Chip>
        </div>

        {/* Live status card */}
        {liveStatus && (
          <ProfileCard className="mt-3 flex items-center gap-3 border-primary/20 bg-primary/5">
            <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{liveStatus}</p>
            </div>
            <Radio className="h-4 w-4 flex-shrink-0 text-primary" />
          </ProfileCard>
        )}

        {/* Save Contact — vCard download, never gated. The in-app "Save to
            Toledo Lokal" save sits in the CTA row directly below. */}
        <Button
          onClick={handleSaveContact}
          variant="outline"
          className="mt-3 h-11 w-full gap-2 rounded-xl text-sm font-semibold"
        >
          <Contact className="h-4 w-4" />
          Save Contact
        </Button>

        {/* CTAs */}
        <div className="mt-3 flex items-center gap-2">
          {primary && (
            <Button onClick={primary.onClick} className="h-11 flex-1 gap-2 rounded-xl text-sm font-semibold">
              <primary.icon className="h-4 w-4" />
              {primary.label}
            </Button>
          )}
          <Button
            onClick={onSave}
            variant={isSaved ? 'default' : 'outline'}
            className="h-11 gap-2 rounded-xl px-4"
          >
            <Bookmark className={cn('h-4 w-4', isSaved && 'fill-current')} />
            {isSaved ? 'Saved' : 'Save'}
          </Button>
          <Button onClick={onShare} variant="outline" size="icon" className="h-11 w-11 flex-shrink-0 rounded-xl">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
