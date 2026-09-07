import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";
import { zodOutputFormat } from "npm:@anthropic-ai/sdk/helpers/zod";
import { z } from "npm:zod@3";

// Ask Toledo.
//
// Two model calls with a database query between them:
//   1. Turn the question into a JSON query spec (structured output).
//   2. Run citygraph_search with that spec.
//   3. Write the answer from the returned rows and nothing else.
//
// The rule that matters: the model answers from Toledo data or it says it does
// not know. It never fills a gap from its own memory. A confident invented
// answer about a road closure or a food bank is worse than no answer, so the
// system prompt forbids it and the client only renders cards for ids that came
// back from the database.

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const MODEL = "claude-opus-5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Business categories the database actually has. The model must map a question
// into these, not invent its own.
const CATEGORIES = [
  "restaurant", "food_truck", "retail", "salon_barber", "gym_fitness",
  "contractor_service", "nonprofit", "childcare", "artist_maker",
  "event_venue", "professional_service", "community_org",
] as const;

const SpecSchema = z.object({
  // find = looking for places, events or help. plan = build an itinerary such
  // as "build my Saturday". explain = asking what changed or what it means.
  intent: z.enum(["find", "plan", "explain"]),
  // Words a listing would actually contain, not the asker's phrasing.
  keywords: z.string(),
  // Use when the question maps onto a category even if no listing text matches.
  categories: z.array(z.enum(CATEGORIES)),
  // organization = businesses and nonprofits. resource = jobs. place = areas,
  // parcels and building projects.
  kinds: z.array(z.enum(["organization", "event", "resource", "place"])),
  // Narrows the developments bucket. Empty means every status.
  development_statuses: z.array(
    z.enum([
      "proposed", "under_review", "approved", "under_construction",
      "completed", "stalled", "cancelled",
    ]),
  ),
  radius_miles: z.number(),
  free_only: z.boolean(),
  time_from: z.string().nullable(),
  time_to: z.string().nullable(),
  limit: z.number().int().min(1).max(40),
});

const AnswerSchema = z.object({
  answer: z.string(),
  // entity_id values from the search results, in the order mentioned.
  cites: z.array(z.string()),
  // False when the results did not answer the question.
  found_anything: z.boolean(),
});

function specSystemPrompt(now: string, neighborhoodName: string | null) {
  return `You turn a Toledo resident's question into a database query spec.

Today is ${now}.
${neighborhoodName ? `The question is scoped to the ${neighborhoodName} neighborhood.` : ""}

Rules:
- Pick keywords a business or event listing would actually contain, not the asker's phrasing. "Somewhere to get my hair cut" becomes keywords "barber salon" and categories ["salon_barber"].
- Prefer a category filter over keywords when the question maps cleanly onto one.
- Set kinds to only what is being asked for. A question about jobs is ["resource"]. A question about what is on is ["event"].
- A question about what is being built, planned, proposed or under construction is kinds ["place"], with keywords naming the thing ("apartments", "grocery", "park"). Set development_statuses when they ask for one part of it: "what is being built" is ["under_construction"], "what is planned" is ["proposed","under_review","approved"]. Leave it empty otherwise.
- A question about renting or finding commercial space is also kinds ["place"], with keywords like "storefront office kitchen warehouse studio". Both building projects and empty spaces come back under that kind.
- Use a time window only when the question implies one. "This weekend" means the coming Saturday and Sunday.
- radius_miles: 1 for "walking distance", 3 for "near me", 30 for anything not obviously local.
- intent "plan" only when they are asking to be given an itinerary or a day laid out.`;
}

const ANSWER_SYSTEM = `You are Ask Toledo. You answer questions about Toledo, Ohio using only the search results you are given.

The single most important rule: every fact in your answer must come from the search results below. You have no other knowledge of Toledo. If the results do not answer the question, say so plainly and suggest what the person could follow to hear about it later. Never guess a business name, an address, an opening time, a price, a phone number or a road closure. An honest "I do not have that" is always better than a confident invention.

How to write:
- Short. Two to four sentences for a simple question.
- Eighth grade reading level. Plain words.
- No em dashes.
- Do not list every result. Lead with the best two or three and say why.
- When you name something from the results, put its entity_id in the cites array so the app can show a card for it. Only ever cite ids that appear in the search results.
- Mention distance when the results carry it and the person asked about nearness.
- For a development, give its status_label and, when the results carry them, the developer and the expected completion. Never say a project is finished or started unless its status says so.
- For a space, give the rent, the size and who to contact when the results carry them. Say "rent not listed" rather than guessing a figure.
- If a result is marked as placeholder or seed data, do not present it as a confirmed fact.

For a "plan" intent, lay the day out in order with times taken from the event data, and give a cost estimate only if the results carry prices. If they do not, say the cost is not listed rather than estimating one.`;

// Structured output means the text block is already schema valid JSON. Read it
// without assuming a particular SDK convenience field is present.
function readJson<T>(response: unknown): T | null {
  const record = response as { parsed_output?: unknown; content?: unknown } | null;

  if (record?.parsed_output) return record.parsed_output as T;

  const blocks = Array.isArray(record?.content) ? record.content : [];
  const textBlock = blocks.find(
    (b): b is { type: string; text: string } =>
      typeof b === "object" && b !== null &&
      (b as { type?: unknown }).type === "text" &&
      typeof (b as { text?: unknown }).text === "string",
  );
  if (!textBlock) return null;

  try {
    return JSON.parse(textBlock.text) as T;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Sign in to ask Toledo." }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return json({ error: "Your session expired. Sign in again." }, 401);

    if (!ANTHROPIC_API_KEY) {
      return json({ error: "Ask Toledo is not configured on this environment yet." }, 503);
    }

    const body = await req.json().catch(() => ({}));
    const question: string = (body.question ?? "").toString().trim();
    const neighborhoodId: string | null = body.neighborhood_id ?? null;
    const neighborhoodName: string | null = body.neighborhood_name ?? null;

    if (!question) return json({ error: "Ask a question first." }, 400);
    if (question.length > 500) return json({ error: "That question is too long." }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // 30 questions a day, counted in ai_chat_usage.
    // This both counts the question and checks the cap, so nothing increments
    // separately below.
    const { data: withinLimit, error: limitError } = await admin.rpc("check_ask_toledo_rate_limit", {
      _user_id: user.id,
    });
    if (!limitError && withinLimit === false) {
      return json({ error: "That is 30 questions today. Come back tomorrow." }, 429);
    }

    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    const now = new Date().toISOString();

    // Step 1: question -> query spec.
    const specResponse = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: specSystemPrompt(now, neighborhoodName),
      output_config: { effort: "low", format: zodOutputFormat(SpecSchema) },
      messages: [{ role: "user", content: question }],
    });

    if (specResponse.stop_reason === "refusal") {
      return json({ error: "I cannot help with that one." }, 200);
    }

    const specParsed = readJson<Record<string, unknown>>(specResponse);
    if (!specParsed) {
      return json({ error: "I could not work out what to search for. Try rephrasing." }, 200);
    }
    const spec: Record<string, unknown> = { ...specParsed };

    // The scope is ours to set, not the model's.
    if (neighborhoodId) spec.neighborhood_id = neighborhoodId;

    // Step 2: run it against the CityGraph, as the asking user.
    const { data: results, error: searchError } = await userClient.rpc("citygraph_search", {
      p_spec: spec,
    });
    if (searchError) {
      return json({ error: "Could not search Toledo right now. Try again." }, 500);
    }

    // Step 3: answer from those rows and nothing else.
    const answerResponse = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: ANSWER_SYSTEM,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium", format: zodOutputFormat(AnswerSchema) },
      messages: [
        {
          role: "user",
          content: `Question: ${question}

Today is ${now}.
Query spec used: ${JSON.stringify(spec)}

Search results:
${JSON.stringify(results, null, 1)}`,
        },
      ],
    });

    if (answerResponse.stop_reason === "refusal") {
      return json({ error: "I cannot help with that one." }, 200);
    }

    const parsed = readJson<{ answer: string; cites: string[]; found_anything: boolean }>(
      answerResponse,
    );
    if (!parsed) {
      return json({ error: "Something went wrong writing that answer. Try again." }, 200);
    }

    // Only hand back cards for ids the database actually returned. This is the
    // backstop against a cited id the model made up.
    const known = new Map<string, Record<string, unknown>>();
    for (
      const bucket of [
        "businesses", "nonprofits", "events", "jobs", "deals", "developments", "spaces",
        "changes",
      ]
    ) {
      for (const row of ((results as Record<string, unknown[]>)?.[bucket] ?? [])) {
        const r = row as Record<string, unknown>;
        if (typeof r.entity_id === "string") known.set(r.entity_id, { ...r, bucket });
      }
    }
    const cards = (parsed.cites ?? [])
      .filter((id) => known.has(id))
      .map((id) => known.get(id));

    return json({
      answer: parsed.answer,
      found_anything: parsed.found_anything,
      cards,
      spec,
    });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return json({ error: "Ask Toledo is busy. Try again in a moment." }, 429);
    }
    console.error("ask-toledo error:", error);
    return json({ error: "Something went wrong. Try again." }, 500);
  }
});
