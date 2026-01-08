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
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Fetch context from database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get businesses, events, deals for context
    const [businessesRes, eventsRes, dealsRes, neighborhoodsRes] = await Promise.all([
      supabase.from('businesses').select('name, description, address, category:categories(name), neighborhood:neighborhoods(name)').eq('status', 'approved').limit(50),
      supabase.from('events').select('title, description, location_text, start_date_time').eq('status', 'approved').gte('start_date_time', new Date().toISOString()).limit(20),
      supabase.from('deals').select('title, description, business:businesses(name)').eq('status', 'approved').limit(20),
      supabase.from('neighborhoods').select('name').limit(20),
    ]);

    const businesses = businessesRes.data || [];
    const events = eventsRes.data || [];
    const deals = dealsRes.data || [];
    const neighborhoods = neighborhoodsRes.data || [];

    const contextString = `
## Toledo Local Data

### Neighborhoods
${neighborhoods.map((n: any) => n.name).join(', ')}

### Local Businesses (${businesses.length} total)
${businesses.slice(0, 20).map((b: any) => `- ${b.name}: ${b.description?.substring(0, 100) || 'No description'}${b.neighborhood ? ` (${b.neighborhood.name})` : ''}`).join('\n')}

### Upcoming Events (${events.length} total)
${events.slice(0, 10).map((e: any) => `- ${e.title} at ${e.location_text || 'TBD'} on ${new Date(e.start_date_time).toLocaleDateString()}`).join('\n')}

### Current Deals (${deals.length} total)
${deals.slice(0, 10).map((d: any) => `- ${d.title} at ${d.business?.name || 'Local business'}`).join('\n')}
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

    console.log("Calling Lovable AI with context...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
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
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to get AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("ask-toledo error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
