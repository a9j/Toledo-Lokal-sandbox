import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// The Toledo API.
//
// Read only, key authenticated, rate limited per key. Everything it serves is
// already public in the app; the key exists to attribute and to throttle, not
// to unlock anything.
//
// The key arrives in an Authorization header rather than a query parameter, so
// it does not end up in browser history, proxy logs or a Referer. api_authenticate
// does the resolving, the limiting and the recording in one call, and it is
// revoked from anon and authenticated so this function is the only caller.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

// Resource name to view. An allowlist, so a path can never name an arbitrary
// table.
const RESOURCES: Record<string, string> = {
  businesses: "api_businesses",
  events: "api_events",
  developments: "api_developments",
  spaces: "api_spaces",
  neighborhoods: "api_neighborhoods",
  changes: "api_changes",
};

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body, null, 1), {
    status,
    headers: { ...corsHeaders, ...extra, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return json({ error: "Read only. Use GET." }, 405);

  try {
    const url = new URL(req.url);
    // /toledo-api/businesses -> "businesses"
    const parts = url.pathname.split("/").filter(Boolean);
    const resource = parts[parts.length - 1] ?? "";

    if (!resource || resource === "toledo-api") {
      return json({
        service: "Toledo API",
        resources: Object.keys(RESOURCES),
        usage: "GET /toledo-api/<resource>?limit=50&offset=0 with header: Authorization: Bearer <key>",
        note: "Read only. Everything here is already public in the app.",
      });
    }

    const view = RESOURCES[resource];
    if (!view) {
      return json({ error: `Unknown resource. Try one of: ${Object.keys(RESOURCES).join(", ")}` }, 404);
    }

    const header = req.headers.get("Authorization") ?? "";
    const key = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: verdict, error: authError } = await admin.rpc("api_authenticate", {
      p_key: key,
      p_resource: resource,
    });
    if (authError) return json({ error: "Could not check that key." }, 500);

    const v = verdict as {
      ok: boolean; status?: number; error?: string;
      limit?: number; used?: number; remaining?: number;
    };
    if (!v?.ok) {
      return json({ error: v?.error ?? "Not authorised." }, v?.status ?? 401);
    }

    // Number("abc") is NaN, and NaN survives Math.min and Math.max, so a bad
    // query string used to reach PostgREST as .range(0, NaN) and 500 after the
    // call had already been counted. Non numbers fall back to the defaults.
    const parsed = (raw: string | null, fallback: number) => {
      const n = Number(raw);
      return raw !== null && raw !== "" && Number.isFinite(n) ? n : fallback;
    };
    const limit = Math.min(Math.max(Math.floor(parsed(url.searchParams.get("limit"), 50)), 1), 200);
    const offset = Math.max(Math.floor(parsed(url.searchParams.get("offset"), 0)), 0);

    const { data, error } = await admin
      .from(view)
      .select("*")
      .range(offset, offset + limit - 1);
    if (error) return json({ error: "Could not read that resource." }, 500);

    return json(
      { resource, count: data?.length ?? 0, limit, offset, data },
      200,
      {
        "X-RateLimit-Limit": String(v.limit ?? ""),
        "X-RateLimit-Remaining": String(v.remaining ?? ""),
      },
    );
  } catch (error) {
    console.error("toledo-api error:", error);
    return json({ error: "Something went wrong." }, 500);
  }
});
