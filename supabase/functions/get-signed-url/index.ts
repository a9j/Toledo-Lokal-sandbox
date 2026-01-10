import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Parse request body
    const { filePath, expiresIn = 3600 } = await req.json();

    // Optional: Log authenticated user if present (but don't require it)
    const authHeader = req.headers.get("Authorization");
    let userId = "anonymous";
    if (authHeader?.startsWith("Bearer ")) {
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData } = await supabaseAuth.auth.getUser(token);
      if (claimsData?.user) {
        userId = claimsData.user.id;
      }
    }
    console.log(`Request from user: ${userId}`);

    if (!filePath) {
      console.error("Missing filePath parameter");
      return new Response(
        JSON.stringify({ error: "filePath is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate file path to prevent directory traversal
    if (filePath.includes("..") || filePath.startsWith("/")) {
      console.error("Invalid file path detected:", filePath);
      return new Response(
        JSON.stringify({ error: "Invalid file path" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate expiration time (max 1 hour for security)
    const safeExpiresIn = Math.min(Math.max(60, expiresIn), 3600);

    console.log(`Generating signed URL for: ${filePath}, expires in: ${safeExpiresIn}s, user: ${userId}`);

    // Use service role to generate signed URLs (required for private buckets)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate signed URL
    const { data, error } = await supabase.storage
      .from("uploads")
      .createSignedUrl(filePath, safeExpiresIn);

    if (error) {
      console.error("Error creating signed URL:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Signed URL generated successfully for user:", userId);
    
    return new Response(
      JSON.stringify({ signedUrl: data.signedUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate signed URL" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
