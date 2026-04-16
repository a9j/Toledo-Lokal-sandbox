import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // =============================================
    // SECURITY: Authenticate the user
    // =============================================
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Authentication required. Please sign in to use the chat." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create client with user's token to verify auth
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      console.error("Authentication failed:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid or expired session. Please sign in again." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Authenticated user: ${user.id}`);

    // =============================================
    // SECURITY: Check rate limit
    // =============================================
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: withinLimit, error: rateLimitError } = await supabaseAdmin.rpc('check_ai_rate_limit', {
      _user_id: user.id
    });

    if (rateLimitError) {
      console.error("Rate limit check failed:", rateLimitError);
      // Continue anyway - don't block users due to rate limit check errors
    } else if (!withinLimit) {
      console.log(`User ${user.id} exceeded rate limit`);
      return new Response(
        JSON.stringify({ error: "Daily message limit reached. Please try again tomorrow." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages } = await req.json();
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    // Get businesses, events, deals for context (using service role for efficiency)
    const [businessesRes, eventsRes, dealsRes, neighborhoodsRes] = await Promise.all([
      supabaseAdmin.from('businesses').select('name, description, address, category:categories(name), neighborhood:neighborhoods(name)').eq('status', 'approved').limit(50),
      supabaseAdmin.from('events').select('title, description, location_text, start_date_time').eq('status', 'approved').gte('start_date_time', new Date().toISOString()).limit(20),
      supabaseAdmin.from('deals').select('title, description, business:businesses(name)').eq('status', 'approved').limit(20),
      supabaseAdmin.from('neighborhoods').select('name').limit(20),
    ]);

    const businesses = businessesRes.data || [];
    const events = eventsRes.data || [];
    const deals = dealsRes.data || [];
    const neighborhoods = neighborhoodsRes.data || [];

    const contextString = `
## Toledo Local Data

### Neighborhoods
${neighborhoods.map((n: Record<string, string>) => n.name).join(', ')}

### Local Businesses (${businesses.length} total)
${businesses.slice(0, 20).map((b: Record<string, unknown>) => `- ${b.name}: ${(b.description as string)?.substring(0, 100) || 'No description'}${b.neighborhood ? ` (${(b.neighborhood as Record<string, string>).name})` : ''}`).join('\n')}

### Upcoming Events (${events.length} total)
${events.slice(0, 10).map((e: Record<string, string>) => `- ${e.title} at ${e.location_text || 'TBD'} on ${new Date(e.start_date_time).toLocaleDateString()}`).join('\n')}

### Current Deals (${deals.length} total)
${deals.slice(0, 10).map((d: Record<string, unknown>) => `- ${d.title} at ${(d.business as Record<string, string>)?.name || 'Local business'}`).join('\n')}
`;

    const systemPrompt = `You are Toledo Connect's friendly AI concierge - a knowledgeable local guide for Toledo, Ohio (the Glass City).

Your personality:
- Warm, enthusiastic, and genuinely helpful
- Proud of Toledo's arts scene, local restaurants, and community spirit
- Knowledgeable about neighborhoods like the Warehouse District, Downtown, Old West End, and more

Your job:
- Answer questions about local businesses, events, restaurants, and things to do
- Give personalized recommendations based on what someone is looking for
- Share insider tips and hidden gems
- Help newcomers discover what makes Toledo special

Guidelines:
- Keep responses concise but helpful (2-4 sentences for simple questions)
- When recommending places, mention specific businesses from the data when relevant
- If you don't have specific data, give general Toledo advice and suggest they explore the app
- Be encouraging about Toledo - it's an underrated gem!

${contextString}`;

    // Convert messages to Anthropic format (filter out system messages, keep user/assistant)
    const anthropicMessages = messages
      .filter((m: { role: string }) => m.role === 'user' || m.role === 'assistant')
      .map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      }));

    console.log(`User ${user.id} calling Anthropic API with context...`);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: systemPrompt,
        messages: anthropicMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("Anthropic API error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to get AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Transform Anthropic SSE stream to OpenAI-compatible format for the frontend
    const reader = response.body!.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            let newlineIndex: number;
            while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
              const line = buffer.slice(0, newlineIndex).trim();
              buffer = buffer.slice(newlineIndex + 1);

              if (!line.startsWith('data: ')) continue;
              const jsonStr = line.slice(6);
              if (!jsonStr || jsonStr === '[DONE]') continue;

              try {
                const event = JSON.parse(jsonStr);

                if (event.type === 'content_block_delta' && event.delta?.text) {
                  // Convert to OpenAI-compatible format
                  const openaiChunk = JSON.stringify({
                    choices: [{ delta: { content: event.delta.text } }],
                  });
                  controller.enqueue(encoder.encode(`data: ${openaiChunk}\n\n`));
                } else if (event.type === 'message_stop') {
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                }
              } catch {
                // Skip unparseable lines
              }
            }
          }
          // Ensure we always send DONE
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          console.error('Stream transform error:', err);
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("ask-toledo error:", error);
    return new Response(JSON.stringify({ error: "Unable to process your request. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
