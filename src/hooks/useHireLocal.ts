import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { hl } from '@/components/hire-local/db';
import type {
  RecordItem,
  RecordItemKind,
  HireReference,
  QualityTag,
  Resume,
  HireOrg,
  HirePerson,
} from '@/components/hire-local/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// profiles carries a permissive public SELECT policy (id, name, avatar_url),
// so an employer can resolve an applicant's display name and neighborhood. We
// read the base table (not profiles_public) because only it exposes user_id and
// neighborhood_id, which we need to key on user_id.
const PROFILE_COLUMNS = 'user_id, name, avatar_url, neighborhood:neighborhoods(name)';
type ProfileRow = {
  user_id: string;
  name: string | null;
  avatar_url: string | null;
  neighborhood: { name: string } | null;
};

async function fetchPerson(userId: string): Promise<HirePerson> {
  const { data } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('user_id', userId)
    .maybeSingle();
  const row = data as ProfileRow | null;
  return {
    user_id: userId,
    name: row?.name ?? null,
    avatar_url: row?.avatar_url ?? null,
    neighborhood: row?.neighborhood?.name ?? null,
  };
}

async function fetchPeople(userIds: string[]): Promise<Map<string, HirePerson>> {
  const map = new Map<string, HirePerson>();
  if (userIds.length === 0) return map;
  const { data } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .in('user_id', userIds);
  ((data as ProfileRow[] | null) ?? []).forEach((row) => {
    map.set(row.user_id, {
      user_id: row.user_id,
      name: row.name,
      avatar_url: row.avatar_url,
      neighborhood: row.neighborhood?.name ?? null,
    });
  });
  return map;
}

const RECORD_ITEM_COLUMNS = `
  id, user_id, kind, title, detail, hours, occurred_on, status,
  claimed_org_id, confirmed_org_id, confirmed_by_user_id, confirmed_at,
  source, refile_note, created_at,
  claimed_org:businesses!record_items_claimed_org_id_fkey(id, name, logo_url, verified),
  confirmed_org:businesses!record_items_confirmed_org_id_fkey(id, name, logo_url, verified)
`;

// ---------------------------------------------------------------------------
// Screen 1 — Applicant profile
// ---------------------------------------------------------------------------

export interface ApplicantProfile {
  person: HirePerson;
  openToWork: boolean;
  resume: Resume | null;
  qualityTags: QualityTag[];
  records: RecordItem[];
  references: HireReference[];
}

// viewerIsOwner controls whether pending and denied items are visible. In a
// true employer view this is false, so only verified items render. RLS enforces
// the same boundary server-side; the flag keeps the person's own view honest.
export function useApplicantProfile(userId: string | undefined, viewerIsOwner: boolean) {
  return useQuery({
    queryKey: ['hire-applicant', userId, viewerIsOwner],
    enabled: !!userId,
    queryFn: async (): Promise<ApplicantProfile> => {
      const uid = userId as string;

      const [person, otwRes, resumeRes, tagsRes, recordsRes, refsRes] = await Promise.all([
        fetchPerson(uid),
        hl.from('open_to_work').select('enabled').eq('user_id', uid).maybeSingle(),
        hl.from('resumes').select('*').eq('user_id', uid).order('uploaded_at', { ascending: false }).limit(1),
        hl.from('quality_tags').select('*').eq('user_id', uid).order('confirmed_count', { ascending: false }),
        hl.from('record_items').select(RECORD_ITEM_COLUMNS).eq('user_id', uid).order('occurred_on', { ascending: false }),
        hl.from('hire_references').select('*, author_org:businesses(id, name, logo_url, verified)').eq('subject_user_id', uid).order('created_at', { ascending: false }),
      ]);

      const openToWork = Boolean((otwRes.data as { enabled?: boolean } | null)?.enabled);
      const resume = ((resumeRes.data as Resume[] | null) ?? [])[0] ?? null;

      let qualityTags = ((tagsRes.data as QualityTag[] | null) ?? []);
      // Only tags neighbors actually confirmed ever display.
      qualityTags = qualityTags.filter((t) => t.confirmed_count > 0 || viewerIsOwner);

      let records = ((recordsRes.data as RecordItem[] | null) ?? []);
      let references = ((refsRes.data as HireReference[] | null) ?? []);

      if (!viewerIsOwner) {
        // Employer view: verified only. RLS already hides pending/denied, but we
        // filter again so the contract is explicit in the UI layer too.
        records = records.filter((r) => r.status === 'verified');
        references = references.filter((r) => r.status === 'verified');
      }

      return { person, openToWork, resume, qualityTags, records, references };
    },
  });
}

// ---------------------------------------------------------------------------
// Screen 2 — Organization confirm queue
// ---------------------------------------------------------------------------

export interface ConfirmQueueCard {
  item: RecordItem;
  person: HirePerson;
}

export function useConfirmQueue(orgId: string | undefined) {
  return useQuery({
    queryKey: ['hire-confirm-queue', orgId],
    enabled: !!orgId,
    queryFn: async (): Promise<ConfirmQueueCard[]> => {
      const res = await hl
        .from('record_items')
        .select(RECORD_ITEM_COLUMNS)
        .eq('claimed_org_id', orgId as string)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (res.error) throw new Error(res.error.message);
      const items = (res.data as RecordItem[] | null) ?? [];
      const people = await fetchPeople([...new Set(items.map((i) => i.user_id))]);
      return items.map((item) => ({
        item,
        person:
          people.get(item.user_id) ?? { user_id: item.user_id, name: null, avatar_url: null, neighborhood: null },
      }));
    },
  });
}

export function useConfirmActions(orgId: string | undefined) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['hire-confirm-queue', orgId] });
    queryClient.invalidateQueries({ queryKey: ['hire-applicant'] });
  };

  const confirm = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await hl.rpc('confirm_record_item', { p_item_id: itemId });
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  const deny = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await hl.rpc('deny_record_item', { p_item_id: itemId });
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  return { confirm, deny };
}

// Org-level hire settings (auto_trust_qr).
export function useOrgHireSettings(orgId: string | undefined) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['hire-org-settings', orgId],
    enabled: !!orgId,
    queryFn: async (): Promise<{ auto_trust_qr: boolean }> => {
      const res = await hl.from('org_hire_settings').select('auto_trust_qr').eq('org_id', orgId as string).maybeSingle();
      return { auto_trust_qr: Boolean((res.data as { auto_trust_qr?: boolean } | null)?.auto_trust_qr) };
    },
  });

  const setAutoTrustQr = useMutation({
    mutationFn: async (value: boolean) => {
      const { error } = await hl
        .from('org_hire_settings')
        .upsert({ org_id: orgId, auto_trust_qr: value, updated_at: new Date().toISOString() }, { onConflict: 'org_id' });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hire-org-settings', orgId] }),
  });

  return { ...query, setAutoTrustQr };
}

// ---------------------------------------------------------------------------
// Screen 3 — Applicant claim form
// ---------------------------------------------------------------------------

export interface FileClaimInput {
  kind: RecordItemKind;
  title: string;
  claimedOrgId: string;
  detail?: string;
  hours?: number;
  occurredOn?: string;
}

export function useFileClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: FileClaimInput) => {
      const { data, error } = await hl.rpc('file_claim', {
        p_kind: input.kind,
        p_title: input.title,
        p_claimed_org_id: input.claimedOrgId,
        p_detail: input.detail ?? null,
        p_hours: input.hours ?? null,
        p_occurred_on: input.occurredOn ?? null,
      });
      if (error) throw new Error(error.message);
      return data as RecordItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hire-applicant'] });
      queryClient.invalidateQueries({ queryKey: ['hire-my-record'] });
    },
  });
}

// Search verified organizations for the claim form. Only verified orgs can ever
// confirm, so the picker only surfaces them.
export function useVerifiedOrgs(search: string) {
  return useQuery({
    queryKey: ['hire-verified-orgs', search],
    queryFn: async (): Promise<HireOrg[]> => {
      let q = supabase
        .from('businesses_public')
        .select('id, name, logo_url, verified')
        .eq('status', 'approved')
        .order('name', { ascending: true })
        .limit(20);
      if (search.trim()) q = q.ilike('name', `%${search.trim()}%`);
      const { data } = await q;
      // The picker shows approved orgs and marks which are verified. A claim can
      // be filed against any org, but only a verified org can ever confirm it,
      // which the server enforces. An unverified pick stays pending and hidden.
      return ((data as { id: string; name: string; logo_url: string | null; verified: boolean | null }[] | null) ?? []).map((b) => ({
        id: b.id,
        name: b.name,
        logo_url: b.logo_url,
        verified: Boolean(b.verified),
      }));
    },
  });
}

// ---------------------------------------------------------------------------
// Open to Work — person-controlled
// ---------------------------------------------------------------------------

export function useOpenToWork() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['hire-open-to-work', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<boolean> => {
      const res = await hl.from('open_to_work').select('enabled').eq('user_id', user!.id).maybeSingle();
      return Boolean((res.data as { enabled?: boolean } | null)?.enabled);
    },
  });

  const setEnabled = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { error } = await hl
        .from('open_to_work')
        .upsert({ user_id: user!.id, enabled, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hire-open-to-work', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['hire-applicant'] });
    },
  });

  return { ...query, setEnabled };
}

// The signed-in user's own businesses where they can confirm (drives the queue
// selector and "view as org" entry points).
export function useMyConfirmOrgs() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['hire-my-confirm-orgs', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<HireOrg[]> => {
      // Owned businesses.
      const owned = await supabase
        .from('businesses')
        .select('id, name, logo_url, verified')
        .eq('owner_user_id', user!.id);
      // Businesses where the user is staff with a confirm-capable role.
      const staff = await supabase
        .from('business_staff')
        .select('business_id, role, business:businesses(id, name, logo_url, verified)')
        .eq('user_id', user!.id)
        .in('role', ['owner', 'admin', 'manager', 'hiring']);

      const map = new Map<string, HireOrg>();
      ((owned.data as HireOrg[] | null) ?? []).forEach((b) => map.set(b.id, b));
      ((staff.data as { business: HireOrg | null }[] | null) ?? []).forEach((s) => {
        if (s.business) map.set(s.business.id, s.business);
      });
      return [...map.values()];
    },
  });
}
