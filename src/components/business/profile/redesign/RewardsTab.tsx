import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Coins, Bookmark, Share2, MapPin, Stamp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BusinessLoopStats } from '@/components/loop/BusinessLoopStats';
import { ProfileBusiness } from './profile-types';
import { ProfileCard, SectionLabel } from './ProfilePrimitives';

interface RewardsTabProps {
  business: ProfileBusiness;
  isSaved: boolean;
  onSave: () => void;
  onShare: () => void;
}

function ActionRow({ icon: Icon, title, subtitle, cta }: { icon: LucideIcon; title: string; subtitle: string; cta: ReactNode }) {
  return (
    <ProfileCard className="flex items-center gap-3">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex-shrink-0">{cta}</div>
    </ProfileCard>
  );
}

export function RewardsTab({ business, isSaved, onSave, onShare }: RewardsTabProps) {
  return (
    <div className="space-y-3">
      <SectionLabel>Earn & belong</SectionLabel>

      {business.isInLoop ? (
        <>
          <Link to="/loop" className="block">
            <ProfileCard className="flex items-center gap-3 border-primary/20 bg-primary/5">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/15">
                <Coins className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">Check in today and earn Loop Points</p>
                <p className="text-xs text-muted-foreground">Points count toward rewards across Toledo Lokal.</p>
              </div>
            </ProfileCard>
          </Link>
          <BusinessLoopStats businessId={business.id} />
        </>
      ) : (
        <ProfileCard className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-secondary">
            <Coins className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">No Loop rewards yet</p>
            <p className="text-xs text-muted-foreground">Save this spot now so you're ready when they join the Loop.</p>
          </div>
        </ProfileCard>
      )}

      <SectionLabel>Connect</SectionLabel>
      <ActionRow
        icon={Stamp}
        title="Save to your Toledo Passport"
        subtitle="Keep this business in your saved local spots."
        cta={<Button size="sm" variant={isSaved ? 'default' : 'outline'} onClick={onSave} className="gap-1.5 rounded-full"><Bookmark className={isSaved ? 'h-4 w-4 fill-current' : 'h-4 w-4'} />{isSaved ? 'Saved' : 'Save'}</Button>}
      />
      <ActionRow
        icon={MapPin}
        title="Share with a neighbor"
        subtitle="Help locals discover this place."
        cta={<Button size="sm" variant="outline" onClick={onShare} className="gap-1.5 rounded-full"><Share2 className="h-4 w-4" />Share</Button>}
      />
    </div>
  );
}
