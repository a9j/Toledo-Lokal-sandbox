import { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, Copy, Check, LogIn, Trash2, Loader2, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { SEOHead } from '@/components/seo/SEOHead';
import { useAuth } from '@/contexts/AuthContext';
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from '@/hooks/usePlatform';
import { SUPABASE_URL } from '@/integrations/supabase/client';

const RESOURCES = [
  { name: 'businesses', what: 'Approved businesses with category, address and neighborhood' },
  { name: 'events', what: 'Approved events that have not finished' },
  { name: 'developments', what: 'Every building project and its status' },
  { name: 'spaces', what: 'Commercial space listed as available' },
  { name: 'neighborhoods', what: 'The nine neighborhoods with counts' },
  { name: 'changes', what: 'The city change log' },
];

export default function Developers() {
  const { user } = useAuth();
  const { data: keys, isLoading, error } = useApiKeys();
  const create = useCreateApiKey();
  const revoke = useRevokeApiKey();

  const [name, setName] = useState('');
  // The plaintext key exists in this component's state and nowhere else. It is
  // never written back to the database and never fetched again.
  const [freshKey, setFreshKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!user) {
    return (
      <>
        <Header title="Toledo API" showBack />
        <PageContainer>
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <KeyRound className="h-6 w-6 text-muted-foreground" />
            </div>
            <h1 className="font-heading text-lg font-semibold">Sign in to get a key</h1>
            <Button asChild className="mt-5">
              <Link to="/auth">
                <LogIn className="mr-1.5 h-4 w-4" />
                Sign in
              </Link>
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  const makeKey = () => {
    if (!name.trim()) {
      toast.error('Give the key a name so you know what it is for.');
      return;
    }
    create.mutate(
      { name: name.trim() },
      {
        onSuccess: (row) => {
          setFreshKey(row.api_key);
          setCopied(false);
          setName('');
        },
        onError: (e: Error) => toast.error(e.message || 'Could not create that key.'),
      },
    );
  };

  const copy = async () => {
    if (!freshKey) return;
    try {
      await navigator.clipboard.writeText(freshKey);
      setCopied(true);
    } catch {
      toast.error('Could not copy. Select the key and copy it by hand.');
    }
  };

  return (
    <>
      <SEOHead
        title="Toledo API | ToledoLokal"
        description="A read only API over Toledo businesses, events, developments and the city change log."
      />
      <Header title="Toledo API" showBack />
      <PageContainer>
        <div className="mb-5">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Toledo API</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Read only. Everything it serves is already public in the app. The key is so we can
            throttle politely, not to unlock anything.
          </p>
        </div>

        {freshKey && (
          <div className="mb-5 rounded-xl border border-primary/40 bg-primary/5 p-4">
            <p className="text-sm font-semibold">Here is your key</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              This is the only time it is shown. We store a hash, not the key, so we cannot show
              it to you again.
            </p>
            <div className="mt-3 flex gap-2">
              <code className="min-w-0 flex-1 overflow-x-auto rounded-lg bg-background px-3 py-2 font-mono text-xs">
                {freshKey}
              </code>
              <Button size="sm" variant="secondary" onClick={copy}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="mt-2"
              onClick={() => setFreshKey(null)}
            >
              I have saved it
            </Button>
          </div>
        )}

        <div className="mb-6 rounded-xl border border-border/60 bg-card p-4">
          <h2 className="text-sm font-semibold">New key</h2>
          <div className="mt-3 flex gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What is it for"
              aria-label="Key name"
            />
            <Button onClick={makeKey} disabled={create.isPending || !name.trim()}>
              {create.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            1000 calls an hour by default.
          </p>
        </div>

        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold">Your keys</h2>
          {isLoading ? (
            <Skeleton className="h-20 w-full rounded-xl" />
          ) : error ? (
            <div className="flex gap-3 rounded-xl border border-border/60 bg-muted/40 p-4">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Could not load your keys. Check your connection and try again.
              </p>
            </div>
          ) : !keys || keys.length === 0 ? (
            <p className="text-sm text-muted-foreground">No keys yet.</p>
          ) : (
            <div className="space-y-2">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{key.name}</p>
                      {!key.active && (
                        <Badge variant="outline" className="text-[10px]">
                          Revoked
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                      {key.key_prefix}…
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {key.calls_last_hour} of {key.rate_limit_per_hour} this hour ·{' '}
                      {key.calls_total} all time
                    </p>
                  </div>
                  {key.active && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        revoke.mutate(key.id, {
                          onSuccess: () => toast.success('Revoked.'),
                          onError: () => toast.error('Could not revoke that key.'),
                        })
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold">How to call it</h2>
          <pre className="overflow-x-auto rounded-xl border border-border/60 bg-card p-4 text-xs leading-relaxed">
{`curl -H "Authorization: Bearer YOUR_KEY" \\
  "${SUPABASE_URL}/functions/v1/toledo-api/businesses?limit=50"`}
          </pre>

          <div className="mt-3 space-y-2">
            {RESOURCES.map((r) => (
              <div key={r.name} className="rounded-xl border border-border/60 bg-card p-3.5">
                <code className="text-xs font-semibold">/{r.name}</code>
                <p className="mt-0.5 text-xs text-muted-foreground">{r.what}</p>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs leading-snug text-muted-foreground">
            The key is the only thing you need to send. No sign in, no other token.
          </p>
        </section>
      </PageContainer>
    </>
  );
}
