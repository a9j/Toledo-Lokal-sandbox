import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Lokal ID: emails a six digit code to the signed in resident so they can prove
// the home address they picked is really theirs. No document upload.
//
// The code is generated here and only its bcrypt hash is stored, so the client
// never receives it and a database read cannot verify anyone's address. The
// matching check lives in the confirm_address_verification RPC.

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FROM = Deno.env.get("AUTH_EMAIL_FROM") || "Toledo Lokal <hello@toledolokal.com>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// 8th grade reading level, no em dashes.
function codeEmail(code: string, address: string) {
  return {
    subject: `Your Toledo Lokal code is ${code}`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <p style="margin:0 0 16px;color:#111;">Here is your code to confirm your address.</p>
        <p style="margin:0 0 20px;font-size:32px;font-weight:700;letter-spacing:6px;color:#111;">${code}</p>
        <p style="margin:0 0 8px;color:#333;">We are confirming this address:</p>
        <p style="margin:0 0 20px;color:#111;font-weight:600;">${address}</p>
        <p style="margin:0 0 8px;color:#666;font-size:14px;">The code works for 15 minutes.</p>
        <p style="margin:0;color:#666;font-size:14px;">If you did not ask for this, you can ignore this email. Nothing changes.</p>
      </div>`,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Not signed in" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Identify the caller from their JWT. Never trust a user id in the body.
    const { data: userData, error: userErr } = await admin.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    const user = userData?.user;
    if (userErr || !user) return json({ error: "Not signed in" }, 401);
    if (!user.email) return json({ error: "No email on this account" }, 400);

    // The address must already be set. We confirm what they picked, not
    // whatever the request claims. Homes live in resident_homes, not profiles:
    // profiles is readable by any signed in user, so a home address on it would
    // be a leak.
    const { data: home } = await admin
      .from("resident_homes")
      .select("parcel_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!home?.parcel_id) {
      return json({ error: "Pick your address first" }, 400);
    }

    const { data: parcel } = await admin
      .from("parcels")
      .select("id, address")
      .eq("id", home.parcel_id)
      .maybeSingle();

    if (!parcel) return json({ error: "That address is no longer on file" }, 400);

    // One code a minute, so this cannot be used to spam an inbox.
    const { data: existing } = await admin
      .from("address_verifications")
      .select("created_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing?.created_at && Date.now() - new Date(existing.created_at).getTime() < 60_000) {
      return json({ error: "Give it a minute before asking for another code" }, 429);
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));

    // Hash in the database so bcrypt lives in exactly one place.
    const { data: hashed, error: hashErr } = await admin.rpc("hash_verification_code", {
      p_code: code,
    });
    if (hashErr || !hashed) return json({ error: "Could not create a code" }, 500);

    const { error: upsertErr } = await admin.from("address_verifications").upsert(
      {
        user_id: user.id,
        parcel_id: parcel.id,
        code_hash: hashed as string,
        expires_at: new Date(Date.now() + 15 * 60_000).toISOString(),
        attempts: 0,
        created_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (upsertErr) return json({ error: "Could not save the code" }, 500);

    if (!RESEND_API_KEY) {
      // Without a mail key there is no way to deliver it. Say so plainly rather
      // than returning ok and leaving someone waiting on an email.
      return json({ error: "Email is not configured on this environment" }, 503);
    }

    const { subject, html } = codeEmail(code, parcel.address);
    const send = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to: [user.email], subject, html }),
    });

    if (!send.ok) {
      return json({ error: "Could not send the email" }, 502);
    }

    return json({ ok: true, sent_to: user.email });
  } catch (_e) {
    return json({ error: "Something went wrong" }, 500);
  }
});
