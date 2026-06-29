import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

async function sendEmail(to: string, subject: string, body: string) {
  if (!RESEND_API_KEY) return false;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #2563eb; margin: 0 0 16px;">ToledoLokal</h1>
      ${subject ? `<h2 style="margin: 0 0 12px; font-size: 18px;">${subject}</h2>` : ''}
      <div style="white-space: pre-wrap;">${body}</div>
      <p style="color: #888; font-size: 12px; margin-top: 24px;">This message was sent by the ToledoLokal team.</p>
    </div>`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'ToledoLokal <hello@toledolokal.com>',
      to: [to],
      subject: subject || 'A message from ToledoLokal',
      html,
    }),
  });

  return response.ok;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'No authorization header' }, 401);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return json({ error: 'Invalid token' }, 401);

    // Only admins may send owner messages
    const { data: roleRow } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    if (!roleRow) return json({ error: 'Admin access required' }, 403);

    const { mode, recipientUserId, businessId, tierFilter, subject, body } = await req.json();

    if (!body || typeof body !== 'string' || !body.trim()) {
      return json({ error: 'Message body is required' }, 400);
    }

    // Resolve the list of recipient owner user ids
    let recipients: { userId: string; businessId: string | null }[] = [];

    if (mode === 'broadcast') {
      let query = supabase
        .from('businesses')
        .select('id, owner_user_id')
        .not('owner_user_id', 'is', null);
      if (tierFilter && tierFilter !== 'all') query = query.eq('tier_status', tierFilter);

      const { data: bizRows, error: bizError } = await query;
      if (bizError) return json({ error: bizError.message }, 400);

      // One message per owner; keep the first business as context
      const seen = new Set<string>();
      for (const row of bizRows ?? []) {
        if (row.owner_user_id && !seen.has(row.owner_user_id)) {
          seen.add(row.owner_user_id);
          recipients.push({ userId: row.owner_user_id, businessId: row.id });
        }
      }
    } else {
      if (!recipientUserId) return json({ error: 'recipientUserId is required' }, 400);
      recipients = [{ userId: recipientUserId, businessId: businessId ?? null }];
    }

    if (recipients.length === 0) return json({ error: 'No owners matched' }, 400);

    let sent = 0;
    let emailed = 0;

    for (const recipient of recipients) {
      let didEmail = false;
      const { data: target } = await supabase.auth.admin.getUserById(recipient.userId);
      const email = target?.user?.email;
      if (email) {
        try {
          didEmail = await sendEmail(email, subject ?? '', body);
        } catch (_e) {
          didEmail = false;
        }
      }

      const { error: insertError } = await supabase.from('owner_messages').insert({
        sender_id: user.id,
        recipient_id: recipient.userId,
        business_id: recipient.businessId,
        subject: subject ?? null,
        body,
        is_broadcast: mode === 'broadcast',
        emailed: didEmail,
      });

      if (!insertError) {
        sent += 1;
        if (didEmail) emailed += 1;
      }
    }

    return json({ sent, emailed, total: recipients.length });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});
