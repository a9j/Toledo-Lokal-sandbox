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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: authError } = await supabaseAuth.auth.getUser(token);
      if (!authError && userData?.user) {
        userId = userData.user.id;
      }
    }

    const { filePaths, expiresIn = 3600 } = await req.json();

    if (!filePaths || !Array.isArray(filePaths) || filePaths.length === 0) {
      return new Response(JSON.stringify({ error: "filePaths array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Limit batch size to prevent abuse
    if (filePaths.length > 20) {
      return new Response(JSON.stringify({ error: "Maximum 20 files per batch" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    const safeExpiresIn = Math.min(Math.max(60, expiresIn), 3600);

    // Helper functions for access checks
    async function isBusinessOwnerOrStaff(uid: string): Promise<boolean> {
      const [{ data: owned }, { data: staff }] = await Promise.all([
        supabaseService.from("businesses").select("id").eq("owner_user_id", uid).limit(1),
        supabaseService.from("business_staff").select("id").eq("user_id", uid).limit(1),
      ]);
      return (owned?.length || 0) > 0 || (staff?.length || 0) > 0;
    }

    // Cache for batch - check all business references at once
    const businessPaths = filePaths.filter((p: string) => 
      p.startsWith("businesses/") || p.startsWith("editors-picks/")
    );
    
    // Fetch all approved business references in one query
    let approvedBusinessRefs = new Set<string>();
    if (businessPaths.length > 0) {
      const { data: businesses } = await supabaseService
        .from("businesses")
        .select("logo_url, editor_pick_image, photos")
        .eq("status", "approved");
      
      if (businesses) {
        for (const biz of businesses) {
          if (biz.logo_url) approvedBusinessRefs.add(biz.logo_url);
          if (biz.editor_pick_image) approvedBusinessRefs.add(biz.editor_pick_image);
          if (biz.photos) {
            for (const photo of biz.photos) {
              approvedBusinessRefs.add(photo);
            }
          }
        }
      }
    }

    let isOwnerOrStaff: boolean | null = null;
    let isAdmin: boolean | null = null;

    async function checkAccess(filePath: string): Promise<boolean> {
      if (filePath.includes("..") || filePath.startsWith("/")) {
        return false;
      }

      const pathParts = filePath.split("/");
      const rootFolder = pathParts[0];

      // Business assets
      if (rootFolder === "businesses" && pathParts[1]) {
        const secondSegment = pathParts[1];

        if (isUuid(secondSegment)) {
          const { data: publicBusiness } = await supabaseService
            .from("businesses")
            .select("id")
            .eq("id", secondSegment)
            .eq("status", "approved")
            .maybeSingle();

          if (publicBusiness) return true;

          if (userId) {
            const { data: businessAccess } = await supabaseService
              .from("businesses")
              .select("id")
              .eq("id", secondSegment)
              .eq("owner_user_id", userId)
              .maybeSingle();

            if (businessAccess) return true;

            const { data: staffAccess } = await supabaseService
              .from("business_staff")
              .select("id")
              .eq("business_id", secondSegment)
              .eq("user_id", userId)
              .maybeSingle();

            if (staffAccess) return true;
          }
        } else {
          // Check pre-fetched approved business references
          if (approvedBusinessRefs.has(filePath)) return true;
          
          if (userId) {
            if (isOwnerOrStaff === null) {
              isOwnerOrStaff = await isBusinessOwnerOrStaff(userId);
            }
            if (isOwnerOrStaff) return true;
          }
        }
      }
      // Editor picks
      else if (rootFolder === "editors-picks") {
        if (approvedBusinessRefs.has(filePath)) return true;
        if (userId) {
          if (isOwnerOrStaff === null) {
            isOwnerOrStaff = await isBusinessOwnerOrStaff(userId);
          }
          if (isOwnerOrStaff) return true;
        }
      }
      // Content folders accessible to authenticated users
      else if (
        userId &&
        (rootFolder === "pulse" ||
          rootFolder === "deals" ||
          rootFolder === "events" ||
          rootFolder === "admin" ||
          rootFolder === "food-trucks")
      ) {
        return true;
      }
      // User's own files
      else if (userId && rootFolder === userId) {
        return true;
      }
      // Avatars
      else if (userId && rootFolder === "avatars" && pathParts[1] === userId) {
        return true;
      }
      // Admin check
      else if (userId) {
        if (isAdmin === null) {
          const { data: adminCheck } = await supabaseService.rpc("has_role", {
            _user_id: userId,
            _role: "admin",
          });
          isAdmin = Boolean(adminCheck);
        }
        if (isAdmin) return true;
      }

      return false;
    }

    // Process all files in parallel
    const results: Record<string, string | null> = {};
    
    await Promise.all(
      filePaths.map(async (filePath: string) => {
        const hasAccess = await checkAccess(filePath);
        
        if (!hasAccess) {
          results[filePath] = null;
          return;
        }

        const { data, error } = await supabaseService.storage
          .from("uploads")
          .createSignedUrl(filePath, safeExpiresIn);

        if (error) {
          console.error(`Error creating signed URL for ${filePath}:`, error);
          results[filePath] = null;
        } else {
          results[filePath] = data.signedUrl;
        }
      })
    );

    console.log(`Batch signed URLs generated: ${Object.keys(results).length} files`);

    return new Response(JSON.stringify({ signedUrls: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate signed URLs" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
