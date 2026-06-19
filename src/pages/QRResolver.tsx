import { useEffect, useRef, useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import tlLogo from '@/assets/tl-logo.png';

type ResolveState =
  | { status: 'loading' }
  | { status: 'redirect'; to: string }
  | { status: 'missing' };

// Permanent QR resolver. The printed QR encodes /qr/:businessId, where
// businessId is the business's immutable id. We look the business up, log the
// scan, and forward to its current public page (by slug when it has one),
// carrying ?via=qr through. Because we redirect from the stable id, the encoded
// value never has to change when a business renames or its slug changes.
export default function QRResolver() {
  const { businessId } = useParams<{ businessId: string }>();
  const [state, setState] = useState<ResolveState>({ status: 'loading' });
  const logged = useRef(false);

  useEffect(() => {
    let active = true;

    (async () => {
      if (!businessId) {
        setState({ status: 'missing' });
        return;
      }

      // Look up the business by its immutable id.
      const { data: business } = await supabase
        .from('businesses_public')
        .select('id, slug')
        .eq('id', businessId)
        .maybeSingle();

      // Log the scan exactly once per visit. Anonymous inserts are allowed by
      // RLS, and a logging failure must never block the redirect, so ignore any
      // error here.
      if (!logged.current) {
        logged.current = true;
        const { data: { session } } = await supabase.auth.getSession();
        await supabase
          .from('qr_scans' as never)
          .insert({ business_id: businessId, had_session: !!session } as never);
      }

      if (!active) return;

      if (business) {
        const ref = business.slug ?? business.id;
        setState({ status: 'redirect', to: `/business/${ref}?via=qr` });
      } else {
        setState({ status: 'missing' });
      }
    })();

    return () => { active = false; };
  }, [businessId]);

  if (state.status === 'redirect') {
    return <Navigate to={state.to} replace />;
  }

  if (state.status === 'missing') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <img src={tlLogo} alt="Toledo Lokal" className="h-16 w-auto" />
        <h1 className="text-xl font-bold text-foreground">This business is no longer listed</h1>
        <p className="text-sm text-muted-foreground">
          The page you scanned may have been removed. Explore other local spots on Toledo Lokal.
        </p>
        <Link to="/explore">
          <Button variant="outline" className="rounded-full">Explore Toledo Lokal</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}
