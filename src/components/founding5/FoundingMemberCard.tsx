import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { SecureImage } from '@/components/ui/secure-image';
import { FoundingMember } from './types';

interface FoundingMemberCardProps {
  member: FoundingMember;
}

const padded = (n: number) => String(n).padStart(2, '0');

export function FoundingMemberCard({ member }: FoundingMemberCardProps) {
  return (
    <Link
      to={`/business/${member.slug ?? member.id}`}
      className="group relative block w-full overflow-hidden rounded-3xl bg-card text-left shadow-sm ring-1 ring-border/60 transition-all duration-300 hover:shadow-xl hover:ring-border focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {/* Founding badge */}
      <div className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full bg-black/55 px-3.5 py-1.5 text-white backdrop-blur-md">
        <span className="text-amber-300 text-xs font-semibold tracking-wider uppercase">
          Founding 5
        </span>
        <span className="text-white/40">·</span>
        <span className="text-xs font-semibold tracking-wider">No. {padded(member.foundingNumber)}</span>
      </div>

      {/* Hero photo */}
      <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
        <SecureImage
          storagePath={member.heroImageUrl}
          alt={member.name}
          imgClassName="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          className="h-full w-full"
        />
      </div>

      {/* Details */}
      <div className="space-y-4 p-6 sm:p-7">
        <div className="space-y-2">
          <h3 className="font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
            {member.name}
          </h3>
          {member.neighborhood && (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {member.neighborhood}
            </span>
          )}
        </div>

        {member.quote && (
          <p className="text-lg leading-relaxed text-foreground/80">
            &ldquo;{member.quote}&rdquo;
          </p>
        )}

        {(member.ownerName || member.ownerImageUrl) && (
          <div className="flex items-center gap-3 pt-1">
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-border/60">
              <SecureImage
                storagePath={member.ownerImageUrl}
                alt={member.ownerName ?? ''}
                imgClassName="object-cover"
                className="h-full w-full"
              />
            </div>
            {member.ownerName && (
              <span className="text-sm font-medium text-muted-foreground">{member.ownerName}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
