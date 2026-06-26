import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  ArrowLeft,
  Briefcase,
  Clock,
  Award,
  ThumbsUp,
  FileText,
  ExternalLink,
  UserPlus,
  Check,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApplicantProfile } from '@/hooks/useHireLocal';
import {
  HireShell,
  HireContainer,
  InitialsAvatar,
  LegendBar,
  StateBadge,
  HireCard,
  SectionLabel,
  EmptyState,
  HireButton,
} from '@/components/hire-local/primitives';
import type { RecordItem, RecordItemKind } from '@/components/hire-local/types';

const KIND_ICON: Record<RecordItemKind, typeof Briefcase> = {
  employment: Briefcase,
  volunteer_hours: Clock,
  certification: Award,
  endorsement: ThumbsUp,
  quality_tag: ThumbsUp,
};

function formatDate(d: string | null): string {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function RecordRow({ item }: { item: RecordItem }) {
  const Icon = KIND_ICON[item.kind];
  const org = item.confirmed_org ?? item.claimed_org;
  const subline =
    item.status === 'verified'
      ? `Confirmed by ${org?.name ?? 'an organization'}`
      : item.status === 'pending'
      ? `Waiting on ${item.claimed_org?.name ?? 'the organization'} to confirm`
      : 'Stays self-reported, hidden from employers';

  return (
    <div className="flex items-start gap-3 px-4 py-3.5">
      <span
        className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ background: 'var(--hl-gray-tint)', color: 'var(--hl-soft)' }}
      >
        <Icon size={17} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="hl-display text-[15px] font-semibold leading-snug" style={{ color: 'var(--hl-ink)' }}>
            {item.title}
            {item.hours ? <span className="font-normal" style={{ color: 'var(--hl-soft)' }}> · {item.hours} hrs</span> : null}
          </p>
          <StateBadge status={item.status} />
        </div>
        <p className="mt-0.5 text-[13px]" style={{ color: 'var(--hl-soft)' }}>
          {subline}
          {item.occurred_on ? ` · ${formatDate(item.occurred_on)}` : ''}
        </p>
        {item.detail && (
          <p className="mt-1 text-[13px]" style={{ color: 'var(--hl-faint)' }}>
            {item.detail}
          </p>
        )}
      </div>
    </div>
  );
}

export default function HireLocalProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const viewerIsOwner = !!user && user.id === userId;
  const { data, isLoading, error } = useApplicantProfile(userId, viewerIsOwner);
  const [invited, setInvited] = useState(false);

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

        {isLoading && <p style={{ color: 'var(--hl-soft)' }}>Loading profile...</p>}
        {error && (
          <EmptyState
            title="We could not load this profile."
            hint="Check your connection and try again."
          />
        )}

        {data && (
          <>
            {/* Header */}
            <div className="flex items-center gap-3.5">
              <InitialsAvatar name={data.person.name} size={56} />
              <div className="min-w-0">
                <h1 className="hl-display text-[22px] font-semibold leading-tight" style={{ color: 'var(--hl-ink)' }}>
                  {data.person.name ?? 'Toledo neighbor'}
                </h1>
                <p className="text-[13px]" style={{ color: 'var(--hl-soft)' }}>
                  {data.person.neighborhood ?? 'Toledo'}
                </p>
              </div>
              {data.openToWork && (
                <span
                  className="ml-auto shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ background: 'var(--hl-green-tint)', color: 'var(--hl-green-deep)' }}
                >
                  Open to work
                </span>
              )}
            </div>

            <div className="mt-4">
              <LegendBar />
            </div>

            {/* Known for */}
            <SectionLabel>Known for / neighbors confirmed</SectionLabel>
            {data.qualityTags.length === 0 ? (
              <EmptyState title="No confirmed tags yet." />
            ) : (
              <div className="flex flex-wrap gap-2">
                {data.qualityTags.map((t) => (
                  <span
                    key={t.id}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold"
                    style={{ background: 'var(--hl-amber-tint)', color: 'var(--hl-amber)' }}
                  >
                    {t.label}
                    <span
                      className="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px]"
                      style={{ background: 'var(--hl-amber)', color: '#fff' }}
                    >
                      {t.confirmed_count}
                    </span>
                  </span>
                ))}
              </div>
            )}

            {/* Record ledger */}
            <SectionLabel>Verified record</SectionLabel>
            {data.records.length === 0 ? (
              <EmptyState
                title="No verified items yet."
                hint={viewerIsOwner ? 'File a claim and an organization can confirm it.' : undefined}
              />
            ) : (
              <HireCard>
                <div className="divide-y" style={{ borderColor: 'var(--hl-line)' }}>
                  {data.records.map((item) => (
                    <RecordRow key={item.id} item={item} />
                  ))}
                </div>
              </HireCard>
            )}

            {/* References */}
            <SectionLabel>References</SectionLabel>
            {data.references.length === 0 ? (
              <EmptyState title="No verified references yet." />
            ) : (
              <div className="space-y-3">
                {data.references.map((r) => (
                  <HireCard key={r.id} className="px-4 py-3.5">
                    <p className="text-[14px] leading-relaxed" style={{ color: 'var(--hl-ink)' }}>
                      &ldquo;{r.body}&rdquo;
                    </p>
                    <p className="mt-2 text-[13px] font-semibold" style={{ color: 'var(--hl-soft)' }}>
                      {r.author_name}
                      {r.author_role ? `, ${r.author_role}` : ''}
                    </p>
                    {r.status === 'verified' && (
                      <p className="mt-0.5 inline-flex items-center gap-1 text-xs" style={{ color: 'var(--hl-amber)' }}>
                        <Check size={13} /> Verified {r.author_org?.name ? `· ${r.author_org.name}` : 'organization'}
                      </p>
                    )}
                  </HireCard>
                ))}
              </div>
            )}

            {/* Resume — secondary, always self-reported */}
            <SectionLabel>Resume / self-reported</SectionLabel>
            {data.resume ? (
              <HireCard className="flex items-center gap-3 px-4 py-3.5">
                <FileText size={18} style={{ color: 'var(--hl-soft)' }} />
                <span className="flex-1 truncate text-[14px]" style={{ color: 'var(--hl-ink)' }}>
                  {data.resume.file_name ?? 'Resume'}
                </span>
                <a
                  href={data.resume.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-semibold"
                  style={{ color: 'var(--hl-green-deep)' }}
                >
                  Open <ExternalLink size={14} />
                </a>
              </HireCard>
            ) : (
              <EmptyState title="No resume attached." />
            )}
          </>
        )}
      </HireContainer>

      {/* Sticky footer — invite keeps the person in control of disclosure */}
      {data && !viewerIsOwner && (
        <div
          className="fixed inset-x-0 bottom-0 z-30 border-t px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
          style={{ background: 'var(--hl-card)', borderColor: 'var(--hl-line)' }}
        >
          <div className="mx-auto flex max-w-md items-center gap-2">
            <HireButton
              variant="primary"
              className="flex-1"
              onClick={() => setInvited(true)}
              disabled={invited}
            >
              {invited ? (
                <>
                  <Check size={16} /> Invited to apply
                </>
              ) : (
                'Invite to apply'
              )}
            </HireButton>
            <HireButton variant="secondary" ariaLabel="Follow this person">
              <UserPlus size={16} />
            </HireButton>
          </div>
        </div>
      )}
    </HireShell>
  );
}
