import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Check for authentication (optional for public content)
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      // Verify the user's token if provided
      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: authError } = await supabaseAuth.auth.getUser(token);

      if (!authError && userData?.user) {
        userId = userData.user.id;
        console.log(`Authenticated request from user: ${userId}`);
      }
    }

    // Parse request body
    const { filePath, expiresIn = 3600 } = await req.json();

    if (!filePath) {
      console.error("Missing filePath parameter");
      return new Response(JSON.stringify({ error: "filePath is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate file path to prevent directory traversal
    if (filePath.includes("..") || filePath.startsWith("/")) {
      console.error("Invalid file path detected:", filePath);
      return new Response(JSON.stringify({ error: "Invalid file path" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // SECURITY: Validate file access permissions
    // File paths are expected to follow patterns like:
    // - avatars/{userId}/... - user's own avatar
    // - businesses/{businessId}/... - business assets (public for approved businesses)
    // - businesses/logos/... or businesses/... - shared folders (public ONLY when referenced by an approved business)
    // - editors-picks/... - public ONLY when referenced by an approved business
    // - {userId}/... - user's own files
    const pathParts = filePath.split("/");
    const rootFolder = pathParts[0];

    // Check if user has permission to access this file
    let hasAccess = false;

    async function isBusinessOwnerOrStaff(uid: string): Promise<boolean> {
      const [{ data: owned }, { data: staff }] = await Promise.all([
        supabaseService.from("businesses").select("id").eq("owner_user_id", uid).limit(1),
        supabaseService.from("business_staff").select("id").eq("user_id", uid).limit(1),
      ]);

      return (owned?.length || 0) > 0 || (staff?.length || 0) > 0;
    }

    async function isReferencedByApprovedBusiness(path: string): Promise<boolean> {
      // logo_url and editor_pick_image are single text columns.
      // photos is a text[].
      const [logoRef, editorRef, photoRef] = await Promise.all([
        supabaseService
          .from("businesses")
          .select("id")
          .eq("status", "approved")
          .eq("logo_url", path)
          .maybeSingle(),
        supabaseService
          .from("businesses")
          .select("id")
          .eq("status", "approved")
          .eq("editor_pick_image", path)
          .maybeSingle(),
        supabaseService
          .from("businesses")
          .select("id")
          .eq("status", "approved")
          // For PostgREST, `contains` maps to the `cs` operator.
          .contains("photos", [path])
          .maybeSingle(),
      ]);

      return Boolean(logoRef.data || editorRef.data || photoRef.data);
    }

    // Allow access to business assets
    if (rootFolder === "businesses" && pathParts[1]) {
      const secondSegment = pathParts[1];

      // Pattern: businesses/{businessId}/...
      if (isUuid(secondSegment)) {
        const businessId = secondSegment;

        // Check if business is approved (public content anyone can view)
        const { data: publicBusiness } = await supabaseService
          .from("businesses")
          .select("id")
          .eq("id", businessId)
          .eq("status", "approved")
          .maybeSingle();

        if (publicBusiness) {
          hasAccess = true;
        }
        // Also allow if user owns or is staff of this business
        else if (userId) {
          const { data: businessAccess } = await supabaseService
            .from("businesses")
            .select("id")
            .eq("id", businessId)
            .eq("owner_user_id", userId)
            .maybeSingle();

          if (businessAccess) {
            hasAccess = true;
          } else {
            const { data: staffAccess } = await supabaseService
              .from("business_staff")
              .select("id")
              .eq("business_id", businessId)
              .eq("user_id", userId)
              .maybeSingle();

            if (staffAccess) {
              hasAccess = true;
            }
          }
        }
      } else {
        // Pattern: businesses/logos/... or businesses/{fileName}...
        // This folder structure does NOT include a businessId, so we only allow public access
        // when the file is referenced by an approved business record.
        if (await isReferencedByApprovedBusiness(filePath)) {
          hasAccess = true;
        } else if (userId) {
          // Allow business owners/staff to generate signed URLs for newly-uploaded assets
          // (used during upload + moderation flows, before DB fields are saved).
          hasAccess = await isBusinessOwnerOrStaff(userId);
        }
      }
    }
    // Allow access to editor picks (public ONLY when referenced)
    else if (rootFolder === "editors-picks") {
      if (await isReferencedByApprovedBusiness(filePath)) {
        hasAccess = true;
      } else if (userId) {
        hasAccess = await isBusinessOwnerOrStaff(userId);
      }
    }
    // Check if it's user's own file (path starts with their user ID)
    else if (userId && rootFolder === userId) {
      hasAccess = true;
    }
    // Check avatars folder
    else if (userId && rootFolder === "avatars" && pathParts[1] === userId) {
      hasAccess = true;
    }
    // Check if user is admin (they can access everything)
    else if (userId) {
      const { data: adminCheck } = await supabaseService.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });

      if (adminCheck) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      console.error(`Access denied for user ${userId || "anonymous"} to path: ${filePath}`);
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate expiration time (max 1 hour for security)
    const safeExpiresIn = Math.min(Math.max(60, expiresIn), 3600);

    console.log(
      `Generating signed URL for: ${filePath}, expires in: ${safeExpiresIn}s, user: ${userId || "anonymous"}`,
    );

    // Generate signed URL
    const { data, error } = await supabaseService.storage.from("uploads").createSignedUrl(filePath, safeExpiresIn);

    if (error) {
      console.error("Error creating signed URL:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Signed URL generated successfully");

    return new Response(JSON.stringify({ signedUrl: data.signedUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate signed URL" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
