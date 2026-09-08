import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Runs one city data connector.
//
// Takes a source_id, works out the handler from the source's kind, fetches,
// upserts a source_record per external record, and records the run. Two
// handlers are real (ical and rss). The rest log that they are not built and
// say so on the admin page rather than pretending to have run.
//
// Only a platform admin may call this. The function holds the service role, so
// an open door here would be an open door to everything.
//
// Nothing this fetches is trusted. A feed is a stranger's XML: every field is
// clamped for length, the count of items is capped, and no value from a feed
// is ever used as SQL or as a URL the app will follow without a scheme check.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const MAX_ITEMS = 200;
const MAX_BYTES = 4_000_000;
const FETCH_TIMEOUT_MS = 20_000;
const clamp = (s: unknown, n: number) =>
  typeof s === "string" ? s.replace(/\s+/g, " ").trim().slice(0, n) : null;

interface Record_ {
  external_id: string;
  payload: Record<string, unknown>;
}

// A feed URL is given by an admin, but an admin can paste anything, and this
// function fetches with the service role in hand. Only plain web URLs, and
// never a loopback or private host, which is the shape of an SSRF.
function safeFeedUrl(raw: string | null): URL | null {
  if (!raw) return null;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.toLowerCase();
  if (
    host === "localhost" || host === "0.0.0.0" || host.endsWith(".localhost") ||
    host.endsWith(".internal") || host === "metadata.google.internal" ||
    /^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    host.startsWith("[")
  ) {
    return null;
  }
  return u;
}

async function fetchText(url: URL): Promise<string> {
  const stop = AbortSignal.timeout(FETCH_TIMEOUT_MS);
  const res = await fetch(url.toString(), {
    signal: stop,
    redirect: "follow",
    headers: { "User-Agent": "ToledoLokal-CityOS/1.0 (connector)" },
  });
  if (!res.ok) throw new Error(`Feed returned ${res.status}`);
  const body = await res.text();
  if (body.length > MAX_BYTES) throw new Error("Feed is too large");
  return body;
}

// ---------------------------------------------------------------- ical
// Unfolds continuation lines, then reads one record per VEVENT. Enough of
// RFC 5545 to import a public calendar, and no more.
function parseIcal(text: string): Record_[] {
  const unfolded = text.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
  const lines = unfolded.split(/\r\n|\n|\r/);
  const out: Record_[] = [];
  let current: Record<string, string> | null = null;

  for (const line of lines) {
    if (line.startsWith("BEGIN:VEVENT")) {
      current = {};
      continue;
    }
    if (line.startsWith("END:VEVENT")) {
      if (current) {
        const uid = current["UID"];
        if (uid) {
          out.push({
            external_id: uid.slice(0, 200),
            payload: {
              kind: "event",
              title: clamp(current["SUMMARY"], 300),
              description: clamp(current["DESCRIPTION"], 2000),
              location: clamp(current["LOCATION"], 300),
              starts_at: icalDate(current["DTSTART"]),
              ends_at: icalDate(current["DTEND"]),
              url: clamp(current["URL"], 500),
            },
          });
        }
      }
      current = null;
      if (out.length >= MAX_ITEMS) break;
      continue;
    }
    if (!current) continue;
    const colon = line.indexOf(":");
    if (colon < 1) continue;
    // SUMMARY;LANGUAGE=en:Thing -> SUMMARY
    const name = line.slice(0, colon).split(";")[0].toUpperCase();
    const value = line.slice(colon + 1)
      .replace(/\\n/g, " ").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\");
    current[name] = value;
  }
  return out;
}

// 20260908T140000Z or 20260908. Anything else is left alone rather than
// guessed at.
function icalDate(raw: string | undefined): string | null {
  if (!raw) return null;
  const m = raw.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/);
  if (!m) return null;
  const [, y, mo, d, hh, mm, ss, z] = m;
  const iso = hh
    ? `${y}-${mo}-${d}T${hh}:${mm}:${ss}${z ? "Z" : ""}`
    : `${y}-${mo}-${d}`;
  return Number.isNaN(Date.parse(iso)) ? null : iso;
}

// ----------------------------------------------------------------- rss
// RSS 2.0 items and Atom entries. A regex reader, not a real XML parser,
// which is fine for reading and would not be for writing.
function parseRss(text: string): Record_[] {
  const out: Record_[] = [];
  const blocks = [
    ...text.matchAll(/<item[\s>][\s\S]*?<\/item>/gi),
    ...text.matchAll(/<entry[\s>][\s\S]*?<\/entry>/gi),
  ];

  for (const block of blocks) {
    const b = block[0];
    const title = tag(b, "title");
    const link = tag(b, "link") ?? attr(b, "link", "href");
    const guid = tag(b, "guid") ?? tag(b, "id") ?? link ?? title;
    if (!guid) continue;
    out.push({
      external_id: guid.slice(0, 200),
      payload: {
        kind: "announcement",
        title: clamp(title, 300),
        summary: clamp(tag(b, "description") ?? tag(b, "summary") ?? tag(b, "content"), 2000),
        url: webUrl(link),
        published_at: rssDate(tag(b, "pubDate") ?? tag(b, "updated") ?? tag(b, "published")),
      },
    });
    if (out.length >= MAX_ITEMS) break;
  }
  return out;
}

function tag(block: string, name: string): string | null {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  if (!m) return null;
  return decodeEntities(m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, " "));
}

function attr(block: string, name: string, which: string): string | null {
  const m = block.match(new RegExp(`<${name}[^>]*\\s${which}=["']([^"']+)["']`, "i"));
  return m ? decodeEntities(m[1]) : null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'").replace(/&apos;/g, "'").replace(/&amp;/g, "&")
    .replace(/\s+/g, " ").trim();
}

// A link out of a feed is shown to people. Only http and https, so a feed
// cannot put a javascript: URL on the page.
function webUrl(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString().slice(0, 500) : null;
  } catch {
    return null;
  }
}

function rssDate(raw: string | null): string | null {
  if (!raw) return null;
  const t = Date.parse(raw);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  let sourceId: string | null = null;

  try {
    // Only a platform admin. This function holds the service role.
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Sign in first." }, 401);

    const caller = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await caller.auth.getUser();
    if (authError || !user) return json({ error: "Your session expired. Sign in again." }, 401);

    const { data: isAdmin } = await admin.rpc("is_platform_admin", { _user_id: user.id });
    if (isAdmin !== true) return json({ error: "Admins only." }, 403);

    const body = await req.json().catch(() => ({}));
    sourceId = typeof body.source_id === "string" ? body.source_id : null;
    if (!sourceId) return json({ error: "Which source? Pass source_id." }, 400);

    const { data: source, error: sourceError } = await admin
      .from("data_sources")
      .select("id, name, kind, url, is_active")
      .eq("id", sourceId)
      .maybeSingle();
    if (sourceError) return json({ error: "Could not read that source." }, 500);
    if (!source) return json({ error: "No source with that id." }, 404);

    // A url on the source, or one in the admin only config.
    let rawUrl: string | null = source.url ?? null;
    if (!rawUrl) {
      const { data: cfg } = await admin
        .from("data_source_config").select("config").eq("source_id", source.id).maybeSingle();
      const c = (cfg?.config ?? {}) as Record<string, unknown>;
      rawUrl = typeof c.url === "string" ? c.url : null;
    }

    if (source.kind !== "ical" && source.kind !== "rss") {
      const status = "not implemented";
      console.log(`connectors-run: ${source.kind} handler is not built (source ${source.id})`);
      await admin.rpc("record_source_run", {
        p_source_id: source.id, p_status: status, p_count: 0,
        p_error: `No handler for kind ${source.kind} yet.`,
      });
      return json({ ok: false, status, records: 0, message: `The ${source.kind} handler is not built yet.` });
    }

    const url = safeFeedUrl(rawUrl);
    if (!url) {
      const status = rawUrl ? "bad url" : "needs url";
      await admin.rpc("record_source_run", {
        p_source_id: source.id, p_status: status, p_count: 0,
        p_error: rawUrl
          ? "That url is not a public web address this can fetch."
          : "No url is set for this source yet.",
      });
      return json({ ok: false, status, records: 0 });
    }

    const text = await fetchText(url);
    const records = source.kind === "ical" ? parseIcal(text) : parseRss(text);

    if (records.length === 0) {
      await admin.rpc("record_source_run", {
        p_source_id: source.id, p_status: "empty", p_count: 0,
        p_error: "The feed was read but held no records this handler understood.",
      });
      return json({ ok: true, status: "empty", records: 0 });
    }

    // Confidence 0.7: a real feed from a real source, and nobody has checked
    // any single record. A human setting verified_at is what raises trust.
    const rows = records.map((r) => ({
      source_id: source.id,
      external_id: r.external_id,
      confidence: 0.7,
      fetched_at: new Date().toISOString(),
      update_frequency: source.kind === "rss" ? "hourly" : "daily",
      payload: r.payload,
    }));

    const { error: upsertError } = await admin
      .from("source_records")
      .upsert(rows, { onConflict: "source_id,external_id" });
    if (upsertError) {
      await admin.rpc("record_source_run", {
        p_source_id: source.id, p_status: "failed", p_count: 0,
        p_error: "Could not save the records.",
      });
      return json({ error: "Could not save the records." }, 500);
    }

    await admin.rpc("record_source_run", {
      p_source_id: source.id, p_status: "ok", p_count: rows.length, p_error: null,
    });

    // Records land in source_records and stop there. Turning one into a live
    // event or announcement is a separate decision with its own review, and
    // is not done here.
    return json({ ok: true, status: "ok", records: rows.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong.";
    if (sourceId) {
      await admin.rpc("record_source_run", {
        p_source_id: sourceId, p_status: "failed", p_count: 0, p_error: message,
      }).catch(() => {});
    }
    console.error("connectors-run error:", error);
    return json({ error: message }, 500);
  }
});
