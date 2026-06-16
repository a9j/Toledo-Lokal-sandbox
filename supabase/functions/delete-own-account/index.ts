import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'No authorization header' }, 401);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return json({ error: 'Invalid token' }, 401);

    const uid = user.id;

    // Delete from tables that lack FK CASCADE to auth.users.
    // Order: dependents first, then the auth user (which cascades the rest).
    await Promise.all([
      supabase.from('connectors').delete().eq('user_id', uid),
      supabase.from('connector_followers').delete().eq('user_id', uid),
      supabase.from('business_staff').delete().eq('user_id', uid),
      supabase.from('challenge_progress').delete().eq('user_id', uid),
      supabase.from('user_badges').delete().eq('user_id', uid),
      supabase.from('user_preferences').delete().eq('user_id', uid),
      supabase.from('ai_chat_usage').delete().eq('user_id', uid),
      supabase.from('stories').delete().eq('author_id', uid),
      supabase.from('story_likes').delete().eq('user_id', uid),
      supabase.from('loop_wallets').delete().eq('user_id', uid),
      supabase.from('loop_mission_progress').delete().eq('user_id', uid),
      supabase.from('loop_badges').delete().eq('user_id', uid),
      supabase.from('loop_donations').delete().eq('user_id', uid),
      supabase.from('loop_qr_scans').delete().eq('user_id', uid),
      supabase.from('loop_redemptions').delete().eq('user_id', uid),
      supabase.from('loop_daily_caps').delete().eq('user_id', uid),
    ]);

    // Now delete the auth user — cascades profiles, user_roles, businesses,
    // saved_items, posts, comments, reviews, and all other FK-constrained tables.
    const { error: deleteError } = await supabase.auth.admin.deleteUser(uid);
    if (deleteError) return json({ error: deleteError.message }, 400);

    return json({ success: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});
