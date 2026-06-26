// join-cohort: server-validated front door for the Charter 100 cohort.
//
// The QR / link only carries an invite token — it is NOT the security boundary.
// All enforcement happens here + in the atomic join_cohort() RPC: token
// validity, the cap, single-use/rotating decrement, and gap-free position are
// all decided server-side under a per-cohort advisory lock. A leaked screenshot
// can never seat member 101.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ status: 'not_signed_in' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return json({ status: 'not_signed_in' }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const inviteToken = typeof body?.token === 'string' ? body.token.trim() : '';
    if (!inviteToken) {
      return json({ status: 'invalid_token' });
    }

    // All atomicity (lock, cap, position, badge, token decrement) lives in the
    // SECURITY DEFINER RPC. We pass the authenticated user id explicitly; the
    // RPC resolves it to a profile.
    const { data, error } = await supabase.rpc('join_cohort', {
      p_token: inviteToken,
      p_user: user.id,
    });

    if (error) {
      console.error('join_cohort RPC error:', error);
      return json({ status: 'error' }, 500);
    }

    // data is the jsonb returned by join_cohort: { status, position? }
    return json(data ?? { status: 'error' });
  } catch (error) {
    console.error('join-cohort failed:', error);
    return json({ status: 'error' }, 500);
  }
});
