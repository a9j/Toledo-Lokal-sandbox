import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ProcessImageRequest {
  storagePath: string;
  bucket?: string;
  sizes?: { name: string; width: number; quality?: number }[];
}

// Default sizes optimized for mobile and web
const DEFAULT_SIZES = [
  { name: 'thumb', width: 150, quality: 75 },
  { name: 'medium', width: 600, quality: 80 },
  { name: 'large', width: 1200, quality: 85 },
];

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Validate auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseUser = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { storagePath, bucket = 'uploads', sizes = DEFAULT_SIZES }: ProcessImageRequest = await req.json();

    if (!storagePath) {
      return new Response(
        JSON.stringify({ error: 'storagePath is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[process-image] Processing: ${storagePath} for user ${user.id}`);

    // Download the original image
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from(bucket)
      .download(storagePath);

    if (downloadError || !fileData) {
      console.error('[process-image] Download error:', downloadError);
      return new Response(
        JSON.stringify({ error: 'Failed to download image', details: downloadError?.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get original file info
    const originalBuffer = await fileData.arrayBuffer();
    const originalSize = originalBuffer.byteLength;
    const contentType = fileData.type || 'image/jpeg';

    console.log(`[process-image] Original size: ${(originalSize / 1024).toFixed(2)}KB`);

    // Get file extension and base path
    const pathParts = storagePath.split('/');
    const fileName = pathParts.pop() || 'image';
    const basePath = pathParts.join('/');
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    const extension = fileName.match(/\.[^/.]+$/)?.[0] || '.jpg';

    // For now, since Deno doesn't have native image processing,
    // we'll use Supabase's image transformation via signed URLs
    // This generates optimized URLs that transform on-the-fly
    const processedImages: Record<string, { url: string; width: number }> = {};

    for (const size of sizes) {
      // Create a transformation URL using Supabase's image transformation
      // Format: /render/image/<transform_options>
      const transformUrl = `${supabaseUrl}/storage/v1/render/image/public/${bucket}/${storagePath}?width=${size.width}&quality=${size.quality || 80}`;
      
      processedImages[size.name] = {
        url: transformUrl,
        width: size.width,
      };
    }

    // Also generate a signed URL for the original
    const { data: signedUrlData } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(storagePath, 3600); // 1 hour

    console.log(`[process-image] Generated ${sizes.length} size variants`);

    return new Response(
      JSON.stringify({
        success: true,
        original: {
          path: storagePath,
          size: originalSize,
          signedUrl: signedUrlData?.signedUrl,
        },
        variants: processedImages,
        transformBaseUrl: `${supabaseUrl}/storage/v1/render/image/public/${bucket}/${storagePath}`,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[process-image] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});