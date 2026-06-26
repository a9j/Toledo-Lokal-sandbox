// Hand-written types for the Hire Local verification engine.
//
// The underlying tables (record_items, qr_checkins, hire_references,
// quality_tags, resumes, open_to_work, hire_follows, org_hire_settings) are
// created by 20260626153500_hire_local_verification.sql but are not yet in the
// auto-generated src/integrations/supabase/types.ts. Per project convention we
// do not hand-edit that file; instead the Hire Local hooks read and write
// through a documented untyped accessor and map rows into these interfaces.
// Regenerate types.ts after the migration is applied to get full typing.

export type RecordItemKind =
  | 'employment'
  | 'volunteer_hours'
  | 'certification'
  | 'endorsement'
  | 'quality_tag';

export type RecordItemStatus = 'pending' | 'verified' | 'denied';

export type RecordItemSource = 'self_claim' | 'qr_checkin' | 'org_issued';

export interface RecordItem {
  id: string;
  user_id: string;
  kind: RecordItemKind;
  title: string;
  detail: string | null;
  hours: number | null;
  occurred_on: string | null;
  status: RecordItemStatus;
  claimed_org_id: string | null;
  confirmed_org_id: string | null;
  confirmed_by_user_id: string | null;
  confirmed_at: string | null;
  source: RecordItemSource;
  refile_note: string | null;
  created_at: string;
  // Optional joined org rows, when the query embeds them.
  claimed_org?: HireOrg | null;
  confirmed_org?: HireOrg | null;
}

export interface HireOrg {
  id: string;
  name: string;
  logo_url: string | null;
  verified: boolean;
  account_type?: string | null;
}

export interface HireReference {
  id: string;
  subject_user_id: string;
  author_user_id: string | null;
  author_org_id: string | null;
  author_name: string;
  author_role: string | null;
  body: string;
  status: 'pending' | 'verified';
  created_at: string;
  author_org?: HireOrg | null;
}

export interface QualityTag {
  id: string;
  user_id: string;
  label: string;
  confirmed_count: number;
  created_at: string;
}

export interface Resume {
  id: string;
  user_id: string;
  file_url: string;
  file_name: string | null;
  uploaded_at: string;
}

export interface OpenToWork {
  user_id: string;
  enabled: boolean;
  updated_at: string;
}

// A person, as shown at the top of a profile or queue card.
export interface HirePerson {
  user_id: string;
  name: string | null;
  avatar_url: string | null;
  neighborhood: string | null;
}

// Friendly labels. Note: these never become a score or ranking; they are only
// for display.
export const KIND_LABELS: Record<RecordItemKind, string> = {
  employment: 'Employment',
  volunteer_hours: 'Volunteer hours',
  certification: 'Certification',
  endorsement: 'Endorsement',
  quality_tag: 'Quality tag',
};

export const KIND_FILE_OPTIONS: { value: RecordItemKind; label: string }[] = [
  { value: 'volunteer_hours', label: 'Volunteer hours' },
  { value: 'employment', label: 'Employment' },
  { value: 'certification', label: 'Certification' },
  { value: 'endorsement', label: 'Endorsement' },
];
