import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Check, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useVerifiedOrgs, useFileClaim } from '@/hooks/useHireLocal';
import { KIND_FILE_OPTIONS, type RecordItemKind, type HireOrg } from '@/components/hire-local/types';
import {
  HireShell,
  HireContainer,
  InitialsAvatar,
  HireCard,
  HireButton,
} from '@/components/hire-local/primitives';

export default function HireLocalClaim() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileClaim = useFileClaim();

  const [search, setSearch] = useState('');
  const [org, setOrg] = useState<HireOrg | null>(null);
  const [kind, setKind] = useState<RecordItemKind>('volunteer_hours');
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [hours, setHours] = useState('');
  const [occurredOn, setOccurredOn] = useState('');

  const { data: orgs, isLoading: orgsLoading } = useVerifiedOrgs(search);

  const labelStyle = { color: 'var(--hl-soft)' } as const;
  const inputClass = 'mt-1 w-full rounded-xl border bg-white px-3.5 py-2.5 text-[15px] outline-none';
  const inputStyle = { borderColor: 'var(--hl-line)', color: 'var(--hl-ink)' } as const;

  const canSubmit = !!user && !!org && title.trim().length > 0 && !fileClaim.isPending;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!org) {
      toast({ title: 'Pick an organization', description: 'Choose who you did the work with.' });
      return;
    }
    if (!title.trim()) {
      toast({ title: 'Add a title', description: 'Say what this claim is.' });
      return;
    }
    fileClaim.mutate(
      {
        kind,
        title: title.trim(),
        claimedOrgId: org.id,
        detail: detail.trim() || undefined,
        hours: hours ? Number(hours) : undefined,
        occurredOn: occurredOn || undefined,
      },
      {
        onSuccess: () => {
          toast({ title: 'Claim sent', description: `Sent to ${org.name} to confirm.` });
          navigate(`/hire-local/p/${user!.id}`);
        },
        onError: (err) =>
          toast({ title: 'Could not send claim', description: (err as Error).message, variant: 'destructive' }),
      },
    );
  };

  return (
    <HireShell>
      <HireContainer>
        <button
          onClick={() => navigate(-1)}
          className="mb-3 inline-flex items-center gap-1 text-sm"
          style={labelStyle}
          aria-label="Go back"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <h1 className="hl-display text-[24px] font-semibold" style={{ color: 'var(--hl-ink)' }}>
          File a claim
        </h1>
        <p className="mt-1 text-[13px] leading-relaxed" style={labelStyle}>
          Tell us what you did and who you did it with. It stays private and unverified until that
          organization approves it.
        </p>

        <form onSubmit={onSubmit} className="mt-5 space-y-5">
          {/* Org picker */}
          <div>
            <label className="text-[13px] font-semibold" style={labelStyle}>
              Organization you did the work with
            </label>
            {org ? (
              <HireCard className="mt-1 flex items-center gap-3 px-3.5 py-3">
                <InitialsAvatar name={org.name} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="hl-display text-[15px] font-semibold" style={{ color: 'var(--hl-ink)' }}>
                    {org.name}
                  </p>
                  {org.verified ? (
                    <p className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--hl-amber)' }}>
                      <ShieldCheck size={12} /> Verified - can confirm your claim
                    </p>
                  ) : (
                    <p className="text-xs" style={{ color: 'var(--hl-faint)' }}>
                      Not on Toledo Lokal yet - stays pending until they join and confirm
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setOrg(null)}
                  className="text-sm font-semibold"
                  style={{ color: 'var(--hl-green-deep)' }}
                >
                  Change
                </button>
              </HireCard>
            ) : (
              <>
                <div className="relative mt-1">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--hl-faint)' }}
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search organizations"
                    className={`${inputClass} pl-9`}
                    style={inputStyle}
                  />
                </div>
                <div className="mt-2 space-y-1.5">
                  {orgsLoading && <p className="text-[13px]" style={labelStyle}>Searching...</p>}
                  {orgs?.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setOrg(o)}
                      className="flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left"
                      style={{ borderColor: 'var(--hl-line)', background: 'var(--hl-card)' }}
                    >
                      <InitialsAvatar name={o.name} size={32} />
                      <span className="flex-1 text-[14px]" style={{ color: 'var(--hl-ink)' }}>
                        {o.name}
                      </span>
                      {o.verified && <ShieldCheck size={15} style={{ color: 'var(--hl-amber)' }} />}
                    </button>
                  ))}
                  {orgs && orgs.length === 0 && !orgsLoading && (
                    <p className="text-[13px]" style={labelStyle}>
                      No match. You can still type the work below; ask them to join Toledo Lokal to
                      confirm it.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Kind */}
          <div>
            <label className="text-[13px] font-semibold" style={labelStyle}>
              What kind of claim
            </label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {KIND_FILE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setKind(opt.value)}
                  className="rounded-full px-3.5 py-1.5 text-[13px] font-semibold"
                  style={
                    kind === opt.value
                      ? { background: 'var(--hl-green)', color: '#fff' }
                      : { background: 'var(--hl-card)', color: 'var(--hl-soft)', border: '1px solid var(--hl-line)' }
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[13px] font-semibold" style={labelStyle}>
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Saturday food pantry shifts"
              className={inputClass}
              style={inputStyle}
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[13px] font-semibold" style={labelStyle}>
                Hours (optional)
              </label>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.25"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div className="flex-1">
              <label className="text-[13px] font-semibold" style={labelStyle}>
                Date (optional)
              </label>
              <input
                type="date"
                value={occurredOn}
                onChange={(e) => setOccurredOn(e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label className="text-[13px] font-semibold" style={labelStyle}>
              Detail (optional)
            </label>
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={3}
              placeholder="What did you do?"
              className={inputClass}
              style={inputStyle}
            />
          </div>

          {org && (
            <p
              className="rounded-xl px-3.5 py-3 text-[13px] leading-relaxed"
              style={{ background: 'var(--hl-gray-tint)', color: 'var(--hl-soft)' }}
            >
              This will be sent to {org.name} to confirm. It stays private and unverified until they
              approve it.
            </p>
          )}

          <HireButton type="submit" variant="primary" className="w-full" disabled={!canSubmit}>
            {fileClaim.isPending ? (
              'Sending...'
            ) : (
              <>
                <Check size={16} /> Send to confirm
              </>
            )}
          </HireButton>
          {!user && (
            <p className="text-center text-[13px]" style={{ color: 'var(--hl-faint)' }}>
              Sign in to file a claim.
            </p>
          )}
        </form>
      </HireContainer>
    </HireShell>
  );
}
