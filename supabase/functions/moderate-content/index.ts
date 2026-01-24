import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ModerationResult {
  safe: boolean;
  flaggedReasons: string[];
  textAnalysis?: {
    safe: boolean;
    issues: string[];
  };
  imageAnalysis?: {
    safe: boolean;
    issues: string[];
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin or authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { text, imageUrl } = await req.json();
    
    console.log('Moderating content:', { 
      hasText: !!text, 
      textLength: text?.length,
      hasImage: !!imageUrl 
    });

    const result: ModerationResult = {
      safe: true,
      flaggedReasons: [],
    };

    // Text moderation
    if (text && text.trim().length > 0) {
      const textResult = await moderateText(text);
      result.textAnalysis = textResult;
      if (!textResult.safe) {
        result.safe = false;
        result.flaggedReasons.push(...textResult.issues);
      }
    }

    // Image moderation
    if (imageUrl) {
      const imageResult = await moderateImage(imageUrl);
      result.imageAnalysis = imageResult;
      if (!imageResult.safe) {
        result.safe = false;
        result.flaggedReasons.push(...imageResult.issues);
      }
    }

    console.log('Moderation result:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Moderation error:', error);
    return new Response(
      JSON.stringify({ error: "Content moderation unavailable. Please try again." }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function moderateText(text: string): Promise<{ safe: boolean; issues: string[] }> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    console.warn('LOVABLE_API_KEY not set, skipping AI moderation');
    // Fallback to basic word filtering
    return basicTextModeration(text);
  }

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'system',
            content: `You are a content moderation AI. Analyze the following text and determine if it contains:
- Profanity or vulgar language
- Hate speech or discrimination
- Threats or violence
- Spam or scam content
- Personal attacks or harassment

Respond with a JSON object ONLY (no markdown, no explanation):
{"safe": true/false, "issues": ["issue1", "issue2"]}`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.1,
        max_tokens: 200
      })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{"safe": true, "issues": []}';
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return { safe: true, issues: [] };
  } catch (error) {
    console.error('AI text moderation failed:', error);
    return basicTextModeration(text);
  }
}

function basicTextModeration(text: string): { safe: boolean; issues: string[] } {
  const lowerText = text.toLowerCase();
  const issues: string[] = [];
  
  // Basic profanity list (minimal for example)
  const profanityPatterns = [
    /\bf+u+c+k+/i,
    /\bs+h+i+t+/i,
    /\ba+s+s+h+o+l+e+/i,
    /\bb+i+t+c+h+/i,
    /\bd+a+m+n+/i,
    /\bc+r+a+p+/i,
  ];
  
  for (const pattern of profanityPatterns) {
    if (pattern.test(lowerText)) {
      issues.push('Contains profanity');
      break;
    }
  }
  
  // Check for spam patterns
  if (/(.)\1{4,}/.test(text)) {
    issues.push('Contains repetitive characters (possible spam)');
  }
  
  return {
    safe: issues.length === 0,
    issues
  };
}

async function moderateImage(imageUrl: string): Promise<{ safe: boolean; issues: string[] }> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    console.warn('LOVABLE_API_KEY not set, skipping image moderation');
    return { safe: true, issues: [] };
  }

  try {
    // Add timeout with AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Is this image safe for a business directory? Check for nudity, violence, hate symbols, or inappropriate content. Respond with JSON only: {"safe": true/false, "issues": []}`
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 100
      })
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('Image moderation API error:', response.status);
      return { safe: true, issues: [] }; // Allow if API fails
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{"safe": true, "issues": []}';
    
    console.log('Image moderation response:', content);
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return { safe: true, issues: [] };
  } catch (error) {
    console.error('AI image moderation failed:', error);
    return { safe: true, issues: [] }; // Default to safe if moderation fails
  }
}
