import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, ShieldCheck, QrCode, Clock, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useConfirmQueue,
  useConfirmActions,
  useOrgHireSettings,
  useMyConfirmOrgs,
  type ConfirmQueueCard,
} from '@/hooks/useHireLocal';
import {
  HireShell,
  HireContainer,
  InitialsAvatar,
  HireCard,
  EmptyState,
  HireButton,
} from '@/components/hire-local/primitives';

function formatWindow(item: ConfirmQueueCard['item']): string {
  if (item.occurred_on) {
    return new Date(item.occurred_on).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }
  return new Date(item.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

function QueueCard({
  card,
  orgId,
}: {
  card: ConfirmQueueCard;
  orgId: string;
}) {
  const { confirm, deny } = useConfirmActions(orgId);
  const { toast } = useToast();
  const [resolved, setResolved] = useState<'confirmed' | 'denied' | null>(null);
  const { item, person } = card;
  const isQr = item.source === 'qr_checkin';

  const onConfirm = () => {
    confirm.mutate(item.id, {
      onSuccess: () => setResolved('confirmed'),
      onError: (e) => toast({ title: 'Could not confirm', description: (e as Error).message, variant: 'destructive' }),
    });
  };
  const onDeny = () => {
    deny.mutate(item.id, {
      onSuccess: () => setResolved('denied'),
      onError: (e) => toast({ title: 'Could not deny', description: (e as Error).message, variant: 'destructive' }),
    });
  };

  if (resolved === 'confirmed') {
    return (
      <HireCard className="px-4 py-4">
        <p className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--hl-amber)' }}>
          <Check size={16} /> Confirmed - now verified on their profile.
        </p>
      </HireCard>
    );
  }
  if (resolved === 'denied') {
    return (
      <HireCard className="px-4 py-4">
        <p className="inline-flex items-center gap-2 text-sm" style={{ color: 'var(--hl-soft)' }}>
          <X size={16} /> Denied - stays self-reported, hidden from employers.
        </p>
      </HireCard>
    );
  }

  return (
    <HireCard className="p-4">
      <div className="flex items-center gap-3">
        <InitialsAvatar name={person.name} size={44} />
        <div className="min-w-0">
          <p className="hl-display text-[16px] font-semibold leading-tight" style={{ color: 'var(--hl-ink)' }}>
            {person.name ?? 'Toledo neighbor'}
          </p>
          <p className="text-[13px]" style={{ color: 'var(--hl-soft)' }}>
            {person.neighborhood ?? 'Toledo'}
          </p>
        </div>
      </div>

      <div
        className="mt-3 rounded-2xl px-3.5 py-3"
        style={{ background: 'var(--hl-gray-tint)' }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--hl-faint)' }}>
          {item.kind.replace('_', ' ')}
        </p>
        <p className="hl-display mt-0.5 text-[15px] font-semibold" style={{ color: 'var(--hl-ink)' }}>
          {item.title}
          {item.hours ? ` · ${item.hours} hrs` : ''}
        </p>
        <p className="mt-0.5 text-[13px]" style={{ color: 'var(--hl-soft)' }}>
          {formatWindow(item)}
        </p>
        {item.detail && (
          <p className="mt-1 text-[13px]" style={{ color: 'var(--hl-soft)' }}>
            {item.detail}
          </p>
        )}
        {isQr && (
          <p
            className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
            style={{ background: 'var(--hl-green-tint)', color: 'var(--hl-green-deep)' }}
          >
            <QrCode size={13} /> Checked in by QR - time computed automatically
          </p>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <HireButton variant="primary" className="flex-1" onClick={onConfirm} disabled={confirm.isPending}>
          <Check size={16} /> Confirm hours
        </HireButton>
        <HireButton variant="secondary" onClick={onDeny} disabled={deny.isPending}>
          Deny
        </HireButton>
      </div>
    </HireCard>
  );
}

export default function HireLocalConfirm() {
  const { orgId: orgIdParam } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const { data: orgs, isLoading: orgsLoading } = useMyConfirmOrgs();
  const orgId = orgIdParam ?? orgs?.[0]?.id;
  const org = orgs?.find((o) => o.id === orgId) ?? orgs?.[0];

  const { data: cards, isLoading } = useConfirmQueue(orgId);
  const settings = useOrgHireSettings(orgId);

  return (
    <HireShell>
      <HireContainer>
        <button
          onClick={() => navigate(-1)}
          className="mb-3 inline-flex items-center gap-1 text-sm"
          style={{ color: 'var(--hl-soft)' }}
          aria-label="Go back"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--hl-faint)' }}>
          {org?.name ?? 'Your organization'}
        </p>
        <h1 className="hl-display mt-0.5 text-[24px] font-semibold" style={{ color: 'var(--hl-ink)' }}>
          Confirm claims
        </h1>

        {org && (
          <span
            className="mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: 'var(--hl-green-tint)', color: 'var(--hl-green-deep)' }}
          >
            <ShieldCheck size={13} /> {org.verified ? 'Verified organization' : 'Pending verification'}
          </span>
        )}

        <p className="mt-3 text-[13px] leading-relaxed" style={{ color: 'var(--hl-soft)' }}>
          Nothing shows on a profile as verified until you confirm it. Confirm what you can vouch
          for. Deny the rest. A denied claim is not deleted; it stays self-reported and hidden from
          employers.
        </p>

        {/* auto-trust QR toggle */}
        {org && (
          <label
            className="mt-4 flex items-center justify-between rounded-2xl border px-4 py-3"
            style={{ background: 'var(--hl-card)', borderColor: 'var(--hl-line)' }}
          >
            <span className="flex items-center gap-2 text-[14px]" style={{ color: 'var(--hl-ink)' }}>
              <Clock size={16} style={{ color: 'var(--hl-soft)' }} /> Auto-trust QR check-ins
            </span>
            <input
              type="checkbox"
              checked={settings.data?.auto_trust_qr ?? false}
              onChange={(e) => settings.setAutoTrustQr.mutate(e.target.checked)}
              className="h-5 w-5 accent-[var(--hl-green)]"
            />
          </label>
        )}

        <div className="mt-5 space-y-3">
          {(isLoading || orgsLoading) && <p style={{ color: 'var(--hl-soft)' }}>Loading queue...</p>}
          {!isLoading && cards && cards.length === 0 && (
            <EmptyState
              title="No pending claims right now."
              hint="When a neighbor files a claim naming your organization, it lands here."
            />
          )}
          {orgId &&
            cards?.map((card) => <QueueCard key={card.item.id} card={card} orgId={orgId} />)}
        </div>
      </HireContainer>
    </HireShell>
  );
}
