import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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
    const siteUrl = (
      Deno.env.get("SITE_URL") || "https://toledolokal.com"
    ).replace(/\/$/, "");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    // Validate caller identity from JWT
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } =
      await supabaseAuth.auth.getUser(token);
    if (authError || !userData?.user)
      return json({ error: "Unauthorized" }, 401);

    const userId = userData.user.id;
    const service = createClient(supabaseUrl, supabaseServiceKey);

    // Verify caller is global admin
    const { data: profile } = await service
      .from("profiles")
      .select("is_admin")
      .eq("user_id", userId)
      .maybeSingle();
    if (!profile?.is_admin) {
      return json({ error: "Admin access required" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const { circle_id, method, destination, note } = body as {
      circle_id?: string;
      method?: string;
      destination?: string;
      note?: string;
    };

    if (!circle_id) return json({ error: "circle_id is required" }, 400);
    if (!method || !["email", "sms", "qr"].includes(method)) {
      return json({ error: "method must be email, sms, or qr" }, 400);
    }
    if ((method === "email" || method === "sms") && !destination) {
      return json(
        { error: `destination is required for ${method} invites` },
        400
      );
    }

    // Check circle exists and get member_cap
    const { data: circle, error: circleErr } = await service
      .from("circles")
      .select("id, member_cap, name")
      .eq("id", circle_id)
      .maybeSingle();
    if (circleErr || !circle) {
      return json({ error: "Circle not found" }, 404);
    }

    // Check cap: count current members + pending invites
    if (circle.member_cap !== null) {
      const { count: memberCount } = await service
        .from("circle_members")
        .select("id", { count: "exact", head: true })
        .eq("circle_id", circle_id);

      const { count: pendingCount } = await service
        .from("circle_invites")
        .select("id", { count: "exact", head: true })
        .eq("circle_id", circle_id)
        .eq("status", "pending");

      const total = (memberCount ?? 0) + (pendingCount ?? 0);
      if (total >= circle.member_cap) {
        return json(
          {
            error: `${circle.name} is full. Remove a member or raise the cap.`,
          },
          409
        );
      }
    }

    // Generate cryptographically random token
    const tokenBytes = new Uint8Array(24);
    crypto.getRandomValues(tokenBytes);
    const inviteToken = Array.from(tokenBytes)
      .map((b) => b.toString(36).padStart(2, "0"))
      .join("")
      .slice(0, 32);

    // Insert the invite
    const { data: invite, error: insertErr } = await service
      .from("circle_invites")
      .insert({
        circle_id,
        invited_by: userId,
        method,
        destination: destination?.trim() || null,
        token: inviteToken,
        note: note?.trim() || null,
        status: "pending",
      })
      .select("id, token, status, created_at, expires_at")
      .single();

    if (insertErr) {
      console.error("Insert invite error:", insertErr);
      return json({ error: "Could not create invite" }, 500);
    }

    const acceptUrl = `${siteUrl}/invite/${inviteToken}`;

    // TODO: Wire email provider (Resend) for method === "email"
    // TODO: Wire SMS provider (Twilio) for method === "sms"
    // For now, return the link so admin can share manually.

    return json({
      token: inviteToken,
      acceptUrl,
      status: invite.status,
      id: invite.id,
    });
  } catch (error) {
    console.error("circle-create-invite failed:", error);
    return json({ error: "Internal server error" }, 500);
  }
});
