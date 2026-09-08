import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Gives entities their embeddings, in batches.
//
// Two steps, and only the second one is required:
//
//   1. Claude writes a short, plain summary of each entity, the kind of
//      sentence a person would use to describe it. Embedding a tidy sentence
//      beats embedding a bag of keywords. If Claude is unavailable this falls
//      back to the name and the existing blurb, which still embeds fine.
//   2. An embeddings provider turns that text into a vector.
//
// Step 2 is the one that cannot be skipped, and Anthropic does not offer an
// embeddings endpoint: the Claude API is Messages, Batches, Files, Token
// Counting, Models and Admin, and none of those return a vector. So a second
// provider key is required, and this function refuses clearly rather than
// writing zeros or pretending.
//
// Admins only. This holds the service role.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

// In preference order. The column is vector(1536), so a provider is only
// listed here when it can return exactly 1536 dimensions.
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const VOYAGE_API_KEY = Deno.env.get("VOYAGE_API_KEY");

const DIMENSIONS = 1536;
const MAX_BATCH = 50;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

interface Row {
  entity_id: string;
  name: string;
  kind: string;
  blurb: string | null;
}

/** One plain sentence per entity, so the vector describes a thing rather than
 *  a keyword soup. Best effort: a failure here is not a failure of the run. */
async function summarize(rows: Row[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!ANTHROPIC_API_KEY) return out;

  try {
    const Anthropic = (await import("npm:@anthropic-ai/sdk")).default;
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    const response = await anthropic.messages.create({
      model: "claude-opus-5",
      max_tokens: 8000,
      thinking: { type: "adaptive" },
      output_config: { effort: "low" },
      system:
        "You write one short sentence describing each thing in a city directory, " +
        "so the sentence can be searched. Use plain words an eighth grader knows. " +
        "Say what it is and what someone would go there for. Never invent a " +
        "detail that is not in the input. No em dashes. Reply with JSON only: " +
        'an object {"summaries": [{"id": "...", "text": "..."}]}.',
      messages: [{
        role: "user",
        content: JSON.stringify(
          rows.map((r) => ({ id: r.entity_id, kind: r.kind, name: r.name, notes: r.blurb })),
        ),
      }],
    });

    const text = response.content.find(
      (b: { type: string }) => b.type === "text",
    ) as { text?: string } | undefined;
    if (!text?.text) return out;

    const parsed = JSON.parse(text.text) as { summaries?: { id: string; text: string }[] };
    for (const s of parsed.summaries ?? []) {
      if (typeof s.id === "string" && typeof s.text === "string") {
        out.set(s.id, s.text.slice(0, 1000));
      }
    }
  } catch (error) {
    console.log("embed-entities: summaries unavailable, using names and blurbs:", error);
  }
  return out;
}

/** Returns one 1536 dimension vector per input string, in order. */
async function embed(texts: string[]): Promise<number[][]> {
  if (OPENAI_API_KEY) {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: texts,
        dimensions: DIMENSIONS,
      }),
    });
    if (!res.ok) throw new Error(`Embeddings provider returned ${res.status}`);
    const body = await res.json() as { data: { index: number; embedding: number[] }[] };
    return body.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
  }

  if (VOYAGE_API_KEY) {
    const res = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VOYAGE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "voyage-3-large",
        input: texts,
        output_dimension: DIMENSIONS,
      }),
    });
    if (!res.ok) throw new Error(`Embeddings provider returned ${res.status}`);
    const body = await res.json() as { data: { index: number; embedding: number[] }[] };
    return body.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
  }

  throw new Error("no provider");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Sign in first." }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const caller = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await caller.auth.getUser();
    if (authError || !user) return json({ error: "Your session expired. Sign in again." }, 401);

    const { data: isAdmin } = await admin.rpc("is_platform_admin", { _user_id: user.id });
    if (isAdmin !== true) return json({ error: "Admins only." }, 403);

    // Say what is missing before doing any work, so nobody waits on a run
    // that was never going to store a vector.
    if (!OPENAI_API_KEY && !VOYAGE_API_KEY) {
      return json({
        error: "No embeddings provider is configured.",
        detail:
          "Anthropic does not offer an embeddings endpoint, so a second provider is needed. " +
          "Add one of these to the Supabase project secrets and call this again: " +
          "OPENAI_API_KEY (uses text-embedding-3-small at 1536 dimensions) or " +
          "VOYAGE_API_KEY (uses voyage-3-large at 1536 dimensions). " +
          "The column city_entities.embedding is vector(1536), so a provider that " +
          "cannot return 1536 dimensions would need a migration first.",
        secrets_accepted: ["OPENAI_API_KEY", "VOYAGE_API_KEY"],
      }, 503);
    }

    const body = await req.json().catch(() => ({}));
    const requested = Number(body.limit);
    const limit = Number.isFinite(requested)
      ? Math.min(Math.max(Math.floor(requested), 1), MAX_BATCH)
      : MAX_BATCH;

    const { data: rows, error: rowsError } = await admin
      .rpc("entities_needing_embeddings", { p_limit: limit });
    if (rowsError) return json({ error: "Could not read the queue." }, 500);

    const queue = (rows ?? []) as Row[];
    if (queue.length === 0) return json({ ok: true, embedded: 0, remaining: 0 });

    const summaries = await summarize(queue);
    const texts = queue.map((r) => {
      const summary = summaries.get(r.entity_id);
      return [r.name, r.kind, summary ?? r.blurb ?? ""].filter(Boolean).join(". ").slice(0, 6000);
    });

    const vectors = await embed(texts);
    if (vectors.length !== queue.length) {
      return json({ error: "The provider returned a different number of vectors." }, 502);
    }

    let embedded = 0;
    for (let i = 0; i < queue.length; i++) {
      const vector = vectors[i];
      if (!Array.isArray(vector) || vector.length !== DIMENSIONS) continue;
      const { error } = await admin
        .from("city_entities")
        .update({ embedding: JSON.stringify(vector), embedded_at: new Date().toISOString() })
        .eq("id", queue[i].entity_id);
      if (!error) embedded++;
    }

    const { count } = await admin
      .from("city_entities")
      .select("id", { count: "exact", head: true })
      .is("embedding", null);

    return json({ ok: true, embedded, remaining: count ?? 0, used_summaries: summaries.size });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong.";
    console.error("embed-entities error:", error);
    return json({ error: message }, 500);
  }
});
