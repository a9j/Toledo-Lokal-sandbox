// hire-qr-checkout: server-side hours computation for Hire Local volunteer
// check-ins. The QR / link only carries an org id (and optional event id). All
// time math happens server-side here and in the SECURITY DEFINER RPCs, so
// neither the volunteer nor the organization ever hand-enters hours.
//
// Actions:
//   checkin  -> opens a qr_checkins row for (user, org). Returns the checkin id.
//   checkout -> stamps scanned_out_at, computes hours from the two timestamps,
//               and produces a pending volunteer_hours record_item (or an
//               auto-verified one if the org turned auto_trust_qr on).
//
// The record_item still lands as pending until an org confirmer approves it,
// unless the org opted into auto-trust. A pending item is invisible to
// employers; only an organization confirm makes it verified.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isValidUUID(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Not signed in' }, 401);
    }

    // A client scoped to the caller's JWT, so the RPCs run as that user and
    // auth.uid() resolves correctly inside the SECURITY DEFINER functions.
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return json({ error: 'Invalid token' }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (action === 'checkin') {
      if (!isValidUUID(body?.orgId)) {
        return json({ error: 'Invalid organization id' }, 400);
      }
      const eventId = isValidUUID(body?.eventId) ? body.eventId : null;
      const { data, error } = await supabase.rpc('hire_qr_checkin', {
        p_org_id: body.orgId,
        p_event_id: eventId,
      });
      if (error) {
        console.error('hire_qr_checkin error:', error.message);
        return json({ error: error.message }, 400);
      }
      return json({ success: true, checkin: data });
    }

    if (action === 'checkout') {
      if (!isValidUUID(body?.checkinId)) {
        return json({ error: 'Invalid check-in id' }, 400);
      }
      const { data, error } = await supabase.rpc('hire_qr_checkout', {
        p_checkin_id: body.checkinId,
      });
      if (error) {
        console.error('hire_qr_checkout error:', error.message);
        return json({ error: error.message }, 400);
      }
      return json({ success: true, checkin: data });
    }

    return json({ error: 'Invalid action' }, 400);
  } catch (error) {
    console.error('hire-qr-checkout failed:', error);
    return json({ error: 'Internal server error' }, 500);
  }
});
