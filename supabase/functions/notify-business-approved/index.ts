import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SITE_URL = (Deno.env.get("SITE_URL") || "https://toledolokal.com").replace(/\/$/, "");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // This function is called by a database webhook/trigger, or by an admin.
    // Validate using service role key or admin auth.
    const { businessId } = await req.json();
    if (!businessId) {
      return new Response(JSON.stringify({ error: "businessId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    const { data: business, error: bizError } = await supabaseService
      .from("businesses")
      .select("id, name, slug, owner_user_id, status")
      .eq("id", businessId)
      .single();

    if (bizError || !business) {
      return new Response(JSON.stringify({ error: "Business not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (business.status !== "approved") {
      return new Response(JSON.stringify({ error: "Business is not approved" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the owner's email
    const { data: authUser, error: userError } = await supabaseService.auth.admin.getUserById(
      business.owner_user_id
    );

    if (userError || !authUser?.user?.email) {
      console.error("Could not find owner email:", userError);
      return new Response(JSON.stringify({ error: "Owner email not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const profileUrl = `${SITE_URL}/business/${business.slug || business.id}`;
    const dashboardUrl = `${SITE_URL}/dashboard`;

    const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1a2e;">Your business is live on ToledoLokal!</h2>
        <p>Great news — <strong>${business.name}</strong> has been approved and is now visible to the Toledo community.</p>
        <p>Here's what you can do next:</p>
        <ul style="color: #333; line-height: 1.8;">
          <li>Share your public profile with customers</li>
          <li>Post updates on your Pulse feed</li>
          <li>Add deals, events, and job listings</li>
        </ul>
        <a href="${dashboardUrl}"
           style="display: inline-block; background: #1a1a2e; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Go to Dashboard
        </a>
        <p style="font-size: 14px;">
          <a href="${profileUrl}" style="color: #1a1a2e;">View your public profile →</a>
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">ToledoLokal — Toledo's local business platform</p>
      </div>
    `;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ToledoLokal <noreply@toledolokal.com>",
        to: [authUser.user.email],
        subject: `${business.name} is now live on ToledoLokal!`,
        html,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error("Resend error:", errText);
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Approval email sent to ${authUser.user.email} for business ${business.name}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
