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

    // The caller must be an admin.
    const { data: adminRow } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    if (!adminRow) return json({ error: 'Admin access required' }, 403);

    const { userId } = await req.json();
    if (!userId || typeof userId !== 'string') {
      return json({ error: 'userId is required' }, 400);
    }

    // Guard rails: never let an admin delete themselves or another admin.
    if (userId === user.id) {
      return json({ error: 'You cannot delete your own account' }, 400);
    }

    const { data: targetAdmin } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    if (targetAdmin) {
      return json({ error: 'Cannot delete another admin account' }, 403);
    }

    // Deleting the auth user cascades to profiles, user_roles, and any
    // businesses they own (all reference auth.users with ON DELETE CASCADE).
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteError) return json({ error: deleteError.message }, 400);

    return json({ success: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});
