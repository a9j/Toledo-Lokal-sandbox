import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const ALERT_TO = "anthonyjanderson@icloud.com";
const ALERT_FROM = "Toledo Lokal <hello@toledolokal.com>";
const CAP = 100;

Deno.serve(async (req: Request) => {
  try {
    const payload = await req.json();
    const row = payload.record ?? {};
    const email = row.email ?? "unknown";
    const platform = row.platform ?? "unknown";
    const source = row.source ?? "unknown";

    const countRes = await fetch(
      `${SUPABASE_URL}/rest/v1/beta_signups?select=id`,
      {
        headers: {
          apikey: SERVICE_ROLE,
          Authorization: `Bearer ${SERVICE_ROLE}`,
          Prefer: "count=exact",
          Range: "0-0",
        },
      },
    );
    const contentRange = countRes.headers.get("content-range") ?? "*/0";
    const total = parseInt(contentRange.split("/")[1] || "0", 10);
    const left = Math.max(0, CAP - total);

    const subject = `New beta signup — ${total} of ${CAP} (${left} seats left)`;
    const html = `
      <div style="font-family:-apple-system,Segoe UI,sans-serif;color:#111">
        <h2 style="margin:0 0 8px">New Toledo Lokal beta signup</h2>
        <p style="margin:0 0 4px"><strong>${email}</strong></p>
        <p style="margin:0 0 16px;color:#555">${platform} · ${source}</p>
        <div style="font-size:22px;font-weight:700">${total} of ${CAP}</div>
        <div style="color:#555">${left} seats left</div>
      </div>`;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: ALERT_FROM, to: ALERT_TO, subject, html }),
    });

    return new Response(JSON.stringify({ ok: true, total, left }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("beta-signup-alert error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
