import { useEffect, useState } from 'react';
import { Loader2, Plus, Ticket } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { JoinQRCode } from '@/components/join/JoinQRCode';
import { siteUrl } from '@/lib/site-url';
import { useToast } from '@/hooks/use-toast';

// Founder-facing Charter 100 invite generation. The QR is only a convenience
// front door — every join is validated server-side by join-cohort. Admin RLS on
// cohort_invites lets the signed-in admin insert tokens directly.
//
// Two shapes (admin picks at generation time):
//   • batch of single-use tokens — print, hand out one per person
//   • one rotating/event token with a use count — a poster or table card

const SLUG = 'charter-100';

type Mode = 'batch' | 'rotating';

interface GeneratedToken {
  token: string;
  url: string;
}

// 128 bits of CSPRNG entropy — unguessable. The token is the only secret the
// QR carries; the cap/eligibility/single-use are all enforced server-side.
function generateToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return 'c100_' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function Charter100Invites() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cohortId, setCohortId] = useState<string | null>(null);
  const [loadingCohort, setLoadingCohort] = useState(true);
  const [mode, setMode] = useState<Mode>('batch');
  const [batchCount, setBatchCount] = useState(10);
  const [rotatingUses, setRotatingUses] = useState(50);
  const [working, setWorking] = useState(false);
  const [tokens, setTokens] = useState<GeneratedToken[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('cohorts')
        .select('id')
        .eq('slug', SLUG)
        .single();
      if (active) {
        setCohortId(data?.id ?? null);
        setLoadingCohort(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const joinUrl = (token: string) =>
    siteUrl(`/join/${SLUG}?token=${encodeURIComponent(token)}`);

  const handleGenerate = async () => {
    if (!cohortId) return;
    setWorking(true);
    setTokens([]);
    try {
      const rows =
        mode === 'batch'
          ? Array.from({ length: Math.min(Math.max(batchCount, 1), 100) }, () => ({
              cohort_id: cohortId,
              token: generateToken(),
              single_use: true,
              uses_remaining: 1,
              created_by: user?.id ?? null,
            }))
          : [
              {
                cohort_id: cohortId,
                token: generateToken(),
                single_use: false,
                uses_remaining: Math.max(rotatingUses, 1),
                created_by: user?.id ?? null,
              },
            ];

      const { error } = await supabase.from('cohort_invites').insert(rows);
      if (error) throw error;

      setTokens(rows.map((r) => ({ token: r.token, url: joinUrl(r.token) })));
      toast({
        title: 'Invites generated',
        description:
          mode === 'batch'
            ? `${rows.length} single-use ${rows.length === 1 ? 'token' : 'tokens'} created.`
            : `Rotating token created (${rows[0].uses_remaining} uses).`,
      });
    } catch (err) {
      console.error('generate invites failed:', err);
      toast({
        variant: 'destructive',
        title: 'Could not generate invites',
        description: 'Check your admin access and try again.',
      });
    } finally {
      setWorking(false);
    }
  };

  if (loadingCohort) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading cohort…
      </div>
    );
  }

  if (!cohortId) {
    return (
      <p className="text-sm text-muted-foreground">
        The Charter 100 cohort row isn't present yet. Apply the cohort migration
        first.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/60 bg-card p-5">
        <div className="mb-4 flex gap-2">
          <Button
            variant={mode === 'batch' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('batch')}
          >
            <Ticket className="mr-1 h-4 w-4" /> Single-use batch
          </Button>
          <Button
            variant={mode === 'rotating' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('rotating')}
          >
            <Ticket className="mr-1 h-4 w-4" /> Rotating / event
          </Button>
        </div>

        {mode === 'batch' ? (
          <div className="space-y-2">
            <Label htmlFor="batch-count">How many single-use tokens?</Label>
            <Input
              id="batch-count"
              type="number"
              min={1}
              max={100}
              value={batchCount}
              onChange={(e) => setBatchCount(Number(e.target.value))}
              className="max-w-[140px]"
            />
            <p className="text-xs text-muted-foreground">
              One person each. Print and hand out — up to 100 at a time.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="rotating-uses">Total uses for this token</Label>
            <Input
              id="rotating-uses"
              type="number"
              min={1}
              value={rotatingUses}
              onChange={(e) => setRotatingUses(Number(e.target.value))}
              className="max-w-[140px]"
            />
            <p className="text-xs text-muted-foreground">
              One code for a poster or table card. Works until the use count runs
              out (or the cohort fills).
            </p>
          </div>
        )}

        <Button className="mt-4" onClick={handleGenerate} disabled={working}>
          {working ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-1 h-4 w-4" />
          )}
          Generate
        </Button>
      </div>

      {tokens.length > 0 && (
        <div>
          <p className="mb-3 text-sm text-muted-foreground">
            {tokens.length === 1
              ? 'Your rotating token. Download or print this code.'
              : `${tokens.length} single-use codes. Each opens the tokenized join page.`}
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tokens.map((t) => (
              <div
                key={t.token}
                className="flex flex-col items-center rounded-2xl border border-border/60 bg-card p-4 text-center"
              >
                <JoinQRCode url={t.url} size={tokens.length === 1 ? 280 : 160} />
                <code className="mt-3 break-all text-[10px] text-muted-foreground">
                  {t.token}
                </code>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
