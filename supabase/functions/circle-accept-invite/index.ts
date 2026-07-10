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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Authentication required" }, 401);

    // Validate caller identity from JWT
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const jwtToken = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } =
      await supabaseAuth.auth.getUser(jwtToken);
    if (authError || !userData?.user) {
      return json({ error: "Authentication required" }, 401);
    }

    const userId = userData.user.id;
    const service = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const { token, preview } = body as { token?: string; preview?: boolean };

    if (!token) return json({ error: "token is required" }, 400);

    // Look up the invite
    const { data: invite, error: inviteErr } = await service
      .from("circle_invites")
      .select("id, circle_id, status, note, expires_at, accepted_by")
      .eq("token", token)
      .maybeSingle();

    if (inviteErr || !invite) {
      return json({ error: "Invite not found" }, 404);
    }

    // Check every bad state
    if (invite.status === "revoked") {
      return json({ error: "This invite has been revoked" }, 410);
    }
    if (invite.status === "expired" || new Date(invite.expires_at) < new Date()) {
      // Also mark as expired if not already
      if (invite.status !== "expired") {
        await service
          .from("circle_invites")
          .update({ status: "expired" })
          .eq("id", invite.id);
      }
      return json({ error: "This invite has expired" }, 410);
    }
    if (invite.status === "accepted") {
      return json({ error: "This invite has already been used" }, 409);
    }

    // Get circle info for display
    const { data: circle } = await service
      .from("circles")
      .select("id, name, slug, member_cap, description")
      .eq("id", invite.circle_id)
      .single();

    if (!circle) {
      return json({ error: "Circle not found" }, 404);
    }

    // Preview mode: return circle name and note without accepting
    if (preview) {
      // Mark as opened on first view
      if (invite.status === "pending") {
        await service
          .from("circle_invites")
          .update({ status: "opened" })
          .eq("id", invite.id);
      }
      return json({
        circle_id: circle.id,
        circle_name: circle.name,
        circle_slug: circle.slug,
        note: invite.note,
      });
    }

    // Check if user is already a member
    const { data: existing } = await service
      .from("circle_members")
      .select("id")
      .eq("circle_id", circle.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      return json({
        circle_id: circle.id,
        circle_slug: circle.slug,
        already_member: true,
      });
    }

    // Re-check cap at accept time
    if (circle.member_cap !== null) {
      const { count: memberCount } = await service
        .from("circle_members")
        .select("id", { count: "exact", head: true })
        .eq("circle_id", circle.id);

      if ((memberCount ?? 0) >= circle.member_cap) {
        return json(
          { error: "This circle is full. No seats remaining." },
          409
        );
      }
    }

    // Insert member and update invite
    const { error: memberErr } = await service.from("circle_members").insert({
      circle_id: circle.id,
      user_id: userId,
      role: "member",
    });

    if (memberErr) {
      console.error("Insert member error:", memberErr);
      return json({ error: "Could not join circle" }, 500);
    }

    await service
      .from("circle_invites")
      .update({ status: "accepted", accepted_by: userId })
      .eq("id", invite.id);

    return json({
      circle_id: circle.id,
      circle_slug: circle.slug,
      joined: true,
    });
  } catch (error) {
    console.error("circle-accept-invite failed:", error);
    return json({ error: "Internal server error" }, 500);
  }
});
