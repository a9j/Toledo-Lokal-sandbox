import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    console.log(`Processing QR action: ${action} for QR: ${qrCodeId}, user: ${user.id}`);

    if (action === 'scan') {
      return await handleScan(supabase, qrCodeId, user.id);
    } else if (action === 'confirm') {
      return await handleStaffConfirm(supabase, scanId, user.id);
    } else {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error processing QR scan:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ─── Burst helper: find the most generous active burst ───
async function findBestBurst(
  supabase: any,
  businessId: string,
  basePoints: number,
  isFirstVisit: boolean
): Promise<{ burstId: string | null; totalPoints: number; bonusPoints: number; burstName: string | null }> {
  const now = new Date().toISOString();

  const { data: bursts } = await supabase
    .from('loop_bursts')
    .select('*')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .lte('starts_at', now)
    .gte('ends_at', now);

  if (!bursts || bursts.length === 0) {
    return { burstId: null, totalPoints: basePoints, bonusPoints: 0, burstName: null };
  }

  let best: { id: string; total: number; bonus: number; name: string } | null = null;

  for (const burst of bursts) {
    // Check max redemptions
    if (burst.max_redemptions && burst.total_redemptions >= burst.max_redemptions) continue;
    // first_visit only applies to first-time visitors
    if (burst.burst_type === 'first_visit' && !isFirstVisit) continue;

    let total = basePoints;
    if (burst.burst_type === 'multiplier') {
      total = Math.round(basePoints * Number(burst.multiplier));
    } else {
      total = basePoints + (burst.bonus_points || 0);
    }

    if (!best || total > best.total) {
      best = { id: burst.id, total, bonus: total - basePoints, name: burst.name };
    }
  }

  if (!best) return { burstId: null, totalPoints: basePoints, bonusPoints: 0, burstName: null };
  return { burstId: best.id, totalPoints: best.total, bonusPoints: best.bonus, burstName: best.name };
}

// Increment burst total_redemptions
async function incrementBurstRedemptions(supabase: any, burstId: string) {
  const { data: burst } = await supabase
    .from('loop_bursts')
    .select('total_redemptions')
    .eq('id', burstId)
    .single();

  if (burst) {
    await supabase
      .from('loop_bursts')
      .update({ total_redemptions: (burst.total_redemptions || 0) + 1 })
      .eq('id', burstId);
  }
}

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

  // 9. Find best active burst (no stacking — most generous wins)
  const burstResult = await findBestBurst(supabase, qrCode.business_id, qrCode.points_value, isFirstVisit);
  const effectivePoints = burstResult.totalPoints;

  // 10. Monthly cap check (using effective points)
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

  // 11. Get or create wallet
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

  // 12. Create scan record
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

  // 13. If no staff confirmation needed, issue points immediately
  if (!qrCode.requires_staff_confirm) {
    const burstDescription = burstResult.burstName
      ? ` (${burstResult.burstName}: +${burstResult.bonusPoints} bonus)`
      : '';

    const { data: transaction, error: txError } = await supabase
      .from('loop_transactions')
      .insert({
        wallet_id: wallet.id,
        transaction_type: 'earn',
        points: effectivePoints,
        business_id: qrCode.business_id,
        qr_code_id: qrCodeId,
        description: `Earned from ${qrCode.name} at ${qrCode.business?.name}${burstDescription}`,
        metadata: burstResult.burstId ? { burst_id: burstResult.burstId, base_points: qrCode.points_value, bonus_points: burstResult.bonusPoints } : null,
      })
      .select()
      .single();

    if (!txError && transaction) {
      // Update wallet
      await supabase.from('loop_wallets').update({
        points_balance: wallet.points_balance + effectivePoints,
        lifetime_earned: wallet.lifetime_earned + effectivePoints,
      }).eq('id', wallet.id);

      // Update business monthly issued
      await supabase.from('business_loop_settings').update({
        points_issued_this_month: (businessSettings.points_issued_this_month || 0) + effectivePoints,
      }).eq('id', businessSettings.id);

      // Update QR scans
      await supabase.from('loop_qr_codes').update({
        total_scans: (qrCode.total_scans || 0) + 1,
      }).eq('id', qrCodeId);

      // Link transaction to scan
      await supabase.from('loop_qr_scans').update({
        transaction_id: transaction.id, status: 'completed',
      }).eq('id', scan.id);

      // Increment burst redemptions
      if (burstResult.burstId) {
        await incrementBurstRedemptions(supabase, burstResult.burstId);
      }
    }
  }

  return new Response(JSON.stringify({
    success: true,
    scan: {
      id: scan.id,
      status: scanStatus,
      points: effectivePoints,
      basePoints: qrCode.points_value,
      bonusPoints: burstResult.bonusPoints,
      burstName: burstResult.burstName,
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

  // 5. Check for previous scans to determine first visit
  const { data: prevScans } = await supabase
    .from('loop_qr_scans')
    .select('id')
    .eq('qr_code_id', scan.qr_code_id)
    .eq('user_id', scan.user_id)
    .neq('id', scanId)
    .limit(1);

  const isFirstVisit = !prevScans || prevScans.length === 0;

  // 6. Find best burst
  const burstResult = await findBestBurst(supabase, scan.qr_code.business_id, scan.qr_code.points_value, isFirstVisit);
  const effectivePoints = burstResult.totalPoints;

  // 7. Business settings
  const { data: businessSettings } = await supabase
    .from('business_loop_settings')
    .select('*')
    .eq('business_id', scan.qr_code.business_id)
    .single();

  // 8. Create transaction
  const burstDescription = burstResult.burstName ? ` (${burstResult.burstName}: +${burstResult.bonusPoints} bonus)` : '';
  const { data: transaction, error: txError } = await supabase
    .from('loop_transactions')
    .insert({
      wallet_id: wallet.id,
      transaction_type: 'earn',
      points: effectivePoints,
      business_id: scan.qr_code.business_id,
      qr_code_id: scan.qr_code.id,
      description: `Earned from ${scan.qr_code.name} at ${scan.qr_code.business?.name}${burstDescription}`,
      metadata: burstResult.burstId ? { burst_id: burstResult.burstId, base_points: scan.qr_code.points_value, bonus_points: burstResult.bonusPoints } : null,
    })
    .select()
    .single();

  if (txError) {
    return new Response(JSON.stringify({ error: 'Failed to issue points' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 9. Update wallet
  await supabase.from('loop_wallets').update({
    points_balance: wallet.points_balance + effectivePoints,
    lifetime_earned: wallet.lifetime_earned + effectivePoints,
  }).eq('id', wallet.id);

  // 10. Update business monthly cap
  if (businessSettings) {
    await supabase.from('business_loop_settings').update({
      points_issued_this_month: (businessSettings.points_issued_this_month || 0) + effectivePoints,
    }).eq('id', businessSettings.id);
  }

  // 11. Update QR stats
  await supabase.from('loop_qr_codes').update({
    total_scans: (scan.qr_code.total_scans || 0) + 1,
  }).eq('id', scan.qr_code.id);

  // 12. Update scan record
  await supabase.from('loop_qr_scans').update({
    transaction_id: transaction.id,
    status: 'completed',
    staff_confirmed_at: new Date().toISOString(),
  }).eq('id', scanId);

  // 13. Increment burst
  if (burstResult.burstId) {
    await incrementBurstRedemptions(supabase, burstResult.burstId);
  }

  return new Response(JSON.stringify({
    success: true,
    message: `${effectivePoints} points issued successfully`,
    points: effectivePoints,
    basePoints: scan.qr_code.points_value,
    bonusPoints: burstResult.bonusPoints,
    burstName: burstResult.burstName,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
