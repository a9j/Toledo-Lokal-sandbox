import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isValidUUID(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { qrCodeId, action, scanId } = await req.json();

    // Validate action
    if (action !== 'scan' && action !== 'confirm') {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate required IDs are valid UUIDs
    if (action === 'scan' && !isValidUUID(qrCodeId)) {
      return new Response(JSON.stringify({ error: 'Invalid QR code ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (action === 'confirm' && !isValidUUID(scanId)) {
      return new Response(JSON.stringify({ error: 'Invalid scan ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing QR action: ${action} for QR: ${qrCodeId}, user: ${user.id}`);

    if (action === 'scan') {
      return await handleScan(supabase, qrCodeId, user.id);
    } else {
      return await handleStaffConfirm(supabase, scanId, user.id);
    }
  } catch (error) {
    console.error('Error processing QR scan:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

const PAUSED_MSG = 'Loop rewards are paused at this location — check back soon!';

async function handleScan(supabase: any, qrCodeId: string, userId: string) {
  // 1. Get QR code details
  const { data: qrCode, error: qrError } = await supabase
    .from('loop_qr_codes')
    .select('*, business:businesses(id, name, logo_url)')
    .eq('id', qrCodeId)
    .single();

  if (qrError || !qrCode) {
    return new Response(JSON.stringify({ error: 'QR code not found' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 2. Validate active
  if (!qrCode.is_active) {
    return new Response(JSON.stringify({ success: false, paused: true, error: PAUSED_MSG }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 3. Validity dates
  const now = new Date();
  if (qrCode.valid_from && new Date(qrCode.valid_from) > now) {
    return new Response(JSON.stringify({ success: false, paused: true, error: PAUSED_MSG }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  if (qrCode.valid_until && new Date(qrCode.valid_until) < now) {
    return new Response(JSON.stringify({ success: false, paused: true, error: PAUSED_MSG }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 4. Previous scans
  const { data: previousScans } = await supabase
    .from('loop_qr_scans')
    .select('id, created_at, status')
    .eq('qr_code_id', qrCodeId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  const isFirstVisit = !previousScans || previousScans.length === 0;

  // 5. Single-use check
  if (qrCode.is_single_use && !isFirstVisit) {
    return new Response(JSON.stringify({ success: false, alreadyEarned: true, error: "You've already earned bonus points here — thanks for visiting!" }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 6. Max scans per user
  if (qrCode.max_scans_per_user && previousScans && previousScans.length >= qrCode.max_scans_per_user) {
    return new Response(JSON.stringify({ success: false, alreadyEarned: true, error: "You've already earned bonus points here — thanks for visiting!" }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 7. Cooldown
  if (qrCode.scan_cooldown_hours && previousScans && previousScans.length > 0) {
    const lastScan = new Date(previousScans[0].created_at);
    const cooldownMs = qrCode.scan_cooldown_hours * 60 * 60 * 1000;
    if (now.getTime() - lastScan.getTime() < cooldownMs) {
      return new Response(JSON.stringify({ success: false, alreadyEarned: true, error: "You've already earned bonus points recently — check back later!" }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // 8. Business Loop settings
  const { data: businessSettings } = await supabase
    .from('business_loop_settings')
    .select('*')
    .eq('business_id', qrCode.business_id)
    .single();

  if (!businessSettings || !businessSettings.is_active || businessSettings.loop_tier_id === 'visible_only') {
    return new Response(JSON.stringify({ success: false, paused: true, error: PAUSED_MSG }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const effectivePoints = qrCode.points_value;

  // 9. Monthly cap check
  const { data: tierData } = await supabase
    .from('loop_tiers')
    .select('points_cap_monthly')
    .eq('id', businessSettings.loop_tier_id)
    .single();

  const monthlyRemaining = (tierData?.points_cap_monthly || 0) - (businessSettings.points_issued_this_month || 0);
  if (monthlyRemaining < effectivePoints) {
    return new Response(JSON.stringify({ success: false, paused: true, error: PAUSED_MSG }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 10. Get or create wallet
  let { data: wallet, error: walletError } = await supabase
    .from('loop_wallets')
    .select('*')
    .eq('user_id', userId)
    .eq('city', 'toledo')
    .single();

  if (walletError && walletError.code === 'PGRST116') {
    const { data: newWallet, error: createError } = await supabase
      .from('loop_wallets')
      .insert({ user_id: userId, city: 'toledo' })
      .select()
      .single();
    if (createError) {
      return new Response(JSON.stringify({ error: 'Failed to create wallet' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    wallet = newWallet;
  }

  // 11. Create scan record
  const scanStatus = qrCode.requires_staff_confirm ? 'pending_confirmation' : 'completed';
  const { data: scan, error: scanError } = await supabase
    .from('loop_qr_scans')
    .insert({ qr_code_id: qrCodeId, user_id: userId, status: scanStatus })
    .select()
    .single();

  if (scanError) {
    return new Response(JSON.stringify({ error: 'Failed to record scan' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 12. If no staff confirmation needed, issue points immediately
  if (!qrCode.requires_staff_confirm) {
    const { data: transaction, error: txError } = await supabase
      .from('loop_transactions')
      .insert({
        wallet_id: wallet.id,
        transaction_type: 'earn',
        points: effectivePoints,
        business_id: qrCode.business_id,
        qr_code_id: qrCodeId,
        description: `Earned from ${qrCode.name} at ${qrCode.business?.name}`,
      })
      .select()
      .single();

    if (!txError && transaction) {
      await supabase.from('loop_wallets').update({
        points_balance: wallet.points_balance + effectivePoints,
        lifetime_earned: wallet.lifetime_earned + effectivePoints,
      }).eq('id', wallet.id);

      await supabase.from('business_loop_settings').update({
        points_issued_this_month: (businessSettings.points_issued_this_month || 0) + effectivePoints,
      }).eq('id', businessSettings.id);

      await supabase.from('loop_qr_codes').update({
        total_scans: (qrCode.total_scans || 0) + 1,
      }).eq('id', qrCodeId);

      await supabase.from('loop_qr_scans').update({
        transaction_id: transaction.id, status: 'completed',
      }).eq('id', scan.id);
    }
  }

  return new Response(JSON.stringify({
    success: true,
    scan: {
      id: scan.id,
      status: scanStatus,
      points: effectivePoints,
      basePoints: qrCode.points_value,
      requiresConfirmation: qrCode.requires_staff_confirm,
      business: qrCode.business,
      qrName: qrCode.name,
    },
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleStaffConfirm(supabase: any, scanId: string, staffUserId: string) {
  // 1. Get scan details
  const { data: scan, error: scanError } = await supabase
    .from('loop_qr_scans')
    .select('*, qr_code:loop_qr_codes(*, business:businesses(id, name, owner_user_id))')
    .eq('id', scanId)
    .single();

  if (scanError || !scan) {
    return new Response(JSON.stringify({ error: 'Scan not found' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 2. Verify staff authorization
  const isOwner = scan.qr_code?.business?.owner_user_id === staffUserId;
  if (!isOwner) {
    const { data: staffCheck } = await supabase
      .from('business_staff')
      .select('id')
      .eq('business_id', scan.qr_code.business_id)
      .eq('user_id', staffUserId)
      .maybeSingle();
    if (!staffCheck) {
      return new Response(JSON.stringify({ error: 'Not authorized' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // 3. Check status
  if (scan.status !== 'pending_confirmation') {
    return new Response(JSON.stringify({ error: 'Scan already processed' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 4. Get wallet
  const { data: wallet } = await supabase
    .from('loop_wallets')
    .select('*')
    .eq('user_id', scan.user_id)
    .eq('city', 'toledo')
    .single();

  if (!wallet) {
    return new Response(JSON.stringify({ error: 'User wallet not found' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const effectivePoints = scan.qr_code.points_value;

  // 5. Business settings
  const { data: businessSettings } = await supabase
    .from('business_loop_settings')
    .select('*')
    .eq('business_id', scan.qr_code.business_id)
    .single();

  // 6. Create transaction
  const { data: transaction, error: txError } = await supabase
    .from('loop_transactions')
    .insert({
      wallet_id: wallet.id,
      transaction_type: 'earn',
      points: effectivePoints,
      business_id: scan.qr_code.business_id,
      qr_code_id: scan.qr_code.id,
      description: `Earned from ${scan.qr_code.name} at ${scan.qr_code.business?.name}`,
    })
    .select()
    .single();

  if (txError) {
    return new Response(JSON.stringify({ error: 'Failed to issue points' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 7. Update wallet
  await supabase.from('loop_wallets').update({
    points_balance: wallet.points_balance + effectivePoints,
    lifetime_earned: wallet.lifetime_earned + effectivePoints,
  }).eq('id', wallet.id);

  // 8. Update business monthly cap
  if (businessSettings) {
    await supabase.from('business_loop_settings').update({
      points_issued_this_month: (businessSettings.points_issued_this_month || 0) + effectivePoints,
    }).eq('id', businessSettings.id);
  }

  // 9. Update QR stats
  await supabase.from('loop_qr_codes').update({
    total_scans: (scan.qr_code.total_scans || 0) + 1,
  }).eq('id', scan.qr_code.id);

  // 10. Update scan record
  await supabase.from('loop_qr_scans').update({
    transaction_id: transaction.id,
    status: 'completed',
    staff_confirmed_at: new Date().toISOString(),
  }).eq('id', scanId);

  return new Response(JSON.stringify({
    success: true,
    message: `${effectivePoints} points issued successfully`,
    points: effectivePoints,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
