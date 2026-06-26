import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Sends Founding Beta invite emails through Resend, following the same pattern
// as send-business-invite. Two modes:
//   { mode: "bulk" }        → flip every beta_signups row to "invited" (via the
//                             admin_beta_bulk_invite RPC) and email each one.
//   { mode: "single", email } → re-send a single invite.
// Admin-gated: the caller's JWT must belong to a platform admin. The DB writes
// happen in the SECURITY DEFINER RPC, which re-checks admin from the validated
// user id, so the service-role client here cannot be used to bypass gating.

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SITE_URL = (Deno.env.get("SITE_URL") || "https://toledolokal.com").replace(/\/$/, "");
// Install paths per platform. Override in Supabase secrets when the real links
// are known; the fallbacks point at the site so emails are never broken.
const TESTFLIGHT_URL = Deno.env.get("BETA_TESTFLIGHT_URL") || `${SITE_URL}/beta/ios`;
const ANDROID_URL = Deno.env.get("BETA_ANDROID_URL") || `${SITE_URL}/beta/android`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 8th grade reading level, confident, minimal. No em dashes anywhere.
function inviteEmail(platform: string): { subject: string; html: string } {
  const installBlock =
    platform === "apple"
      ? `
        <p style="margin:0 0 8px;"><strong>Get in on your iPhone</strong></p>
        <ol style="margin:0 0 16px; padding-left:20px; color:#333;">
          <li style="margin-bottom:6px;">Install TestFlight from the App Store. It is free.</li>
          <li style="margin-bottom:6px;">Open this invite on your phone and tap the button below.</li>
          <li style="margin-bottom:6px;">Tap Accept, then Install, and open Toledo Lokal.</li>
        </ol>`
      : `
        <p style="margin:0 0 8px;"><strong>Get in on your Android phone</strong></p>
        <ol style="margin:0 0 16px; padding-left:20px; color:#333;">
          <li style="margin-bottom:6px;">Open this invite on your phone and tap the button below.</li>
          <li style="margin-bottom:6px;">Install Toledo Lokal.</li>
          <li style="margin-bottom:6px;">Open the app and sign in with this email.</li>
        </ol>`;

  const installUrl = platform === "apple" ? TESTFLIGHT_URL : ANDROID_URL;
  const installLabel = platform === "apple" ? "Open in TestFlight" : "Install Toledo Lokal";

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1a1a2e; margin: 0 0 12px;">The beta is open</h2>
      <p style="margin:0 0 12px; color:#333;">
        Good news. The Toledo Lokal app cleared review and the beta is now open.
        You signed up early, so you are in the founding group.
      </p>
      <p style="margin:0 0 16px; color:#333;">
        Your founding cohort is a private space to chat, see beta only job posts,
        and tell us what to build next. Here is how to get in.
      </p>
      ${installBlock}
      <a href="${installUrl}"
         style="display: inline-block; background: #2F6BFF; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 8px 0 16px;">
        ${installLabel}
      </a>
      <p style="color: #666; font-size: 14px; margin:0 0 4px;">
        Or copy this link: ${installUrl}
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #999; font-size: 12px; margin:0;">ToledoLokal. Built by Toledo, for Toledo.</p>
    </div>
  `;
  return { subject: "Your Toledo Lokal beta invite is ready", html };
}

async function sendOne(to: string, platform: string): Promise<boolean> {
  const { subject, html } = inviteEmail(platform === "apple" ? "apple" : "android");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "ToledoLokal <noreply@toledolokal.com>",
      to: [to],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    console.error("Resend error:", await res.text());
    return false;
  }
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !userData?.user) return json({ error: "Unauthorized" }, 401);

    const service = createClient(supabaseUrl, supabaseServiceKey);

    // Confirm the caller is a platform admin before doing anything.
    const { data: roleRow } = await service
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .in("role", ["admin", "super_admin"])
      .maybeSingle();
    if (!roleRow) return json({ error: "Admin access required" }, 403);

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return json({ error: "Email service not configured" }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const mode = body?.mode === "single" ? "single" : "bulk";

    let recipients: { email: string; platform: string }[] = [];

    if (mode === "single") {
      const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
      if (!email) return json({ error: "email is required" }, 400);
      const { data: member } = await service
        .from("beta_members")
        .select("email, platform")
        .eq("email", email)
        .maybeSingle();
      if (!member) return json({ error: "Not a beta member" }, 404);
      recipients = [{ email: member.email, platform: member.platform }];
    } else {
      // Bulk: the RPC flips signups to invited and returns the list to email.
      // It re-checks admin from the validated user id we pass in.
      const { data, error } = await service.rpc("admin_beta_bulk_invite", {
        p_admin: userData.user.id,
      });
      if (error) {
        console.error("admin_beta_bulk_invite error:", error);
        return json({ error: "Could not prepare invites" }, 500);
      }
      recipients = (data as { email: string; platform: string }[] | null) ?? [];
    }

    let sent = 0;
    let failed = 0;
    for (const r of recipients) {
      const ok = await sendOne(r.email, r.platform);
      if (ok) sent++;
      else failed++;
    }

    return json({ success: true, sent, failed, total: recipients.length });
  } catch (error) {
    console.error("send-beta-invite failed:", error);
    return json({ error: "Internal server error" }, 500);
  }
});
