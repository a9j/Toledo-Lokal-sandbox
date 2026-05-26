const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
// Where Founding 5 application alerts are sent. Set this secret in Supabase.
const NOTIFY_EMAIL = Deno.env.get('FOUNDING_NOTIFY_EMAIL');

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const CATEGORY_LABELS: Record<string, string> = {
  morning: 'Morning (coffee, breakfast)',
  evening: 'Evening (dinner, drinks)',
  retail: 'Retail (shops, goods)',
  experience: 'Experience (things to do)',
  other: 'Something else',
};

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
    const {
      applicationId,
      businessName,
      ownerName,
      email,
      phone,
      neighborhood,
      category,
      whyUs,
    } = await req.json();

    if (!businessName || !ownerName || !email) {
      return json({ error: 'Missing required fields' }, 400);
    }

    // Best-effort: keep the public application table tidy if an id was passed,
    // but the row is already inserted by the client. We only send the alert.
    if (!RESEND_API_KEY || !NOTIFY_EMAIL) {
      // Nothing to do, but do not surface this as a failure to the applicant.
      return json({ ok: false, reason: 'email_not_configured' });
    }

    const categoryLabel = category ? (CATEGORY_LABELS[category] ?? category) : 'Not given';
    const rows: [string, string][] = [
      ['Business', businessName],
      ['Owner', ownerName],
      ['Email', email],
      ['Phone', phone || 'Not given'],
      ['Neighborhood', neighborhood || 'Not given'],
      ['Category', categoryLabel],
    ];

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h1 style="color: #2563eb; margin: 0 0 4px;">ToledoLokal</h1>
        <h2 style="margin: 0 0 16px; font-size: 18px;">New Founding 5 application</h2>
        <table style="border-collapse: collapse; width: 100%;">
          ${rows
            .map(
              ([label, value]) => `
            <tr>
              <td style="padding: 6px 12px 6px 0; color: #888; vertical-align: top; white-space: nowrap;">${esc(label)}</td>
              <td style="padding: 6px 0; font-weight: 500;">${esc(String(value))}</td>
            </tr>`,
            )
            .join('')}
        </table>
        ${
          whyUs
            ? `<p style="margin: 16px 0 4px; color: #888;">Why them</p><div style="white-space: pre-wrap; background: #f6f7f9; border-radius: 8px; padding: 12px;">${esc(whyUs)}</div>`
            : ''
        }
        <p style="color: #888; font-size: 12px; margin-top: 24px;">Reply to this email to reach the applicant directly.${applicationId ? ` (Ref ${esc(String(applicationId))})` : ''}</p>
      </div>`;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ToledoLokal <noreply@toledolokal.com>',
        to: [NOTIFY_EMAIL],
        reply_to: email,
        subject: `New Founding 5 application: ${businessName}`,
        html,
      }),
    });

    return json({ ok: response.ok });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});
