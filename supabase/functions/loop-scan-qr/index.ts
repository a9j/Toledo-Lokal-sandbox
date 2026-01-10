import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify JWT and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { qrCodeId, action, scanId } = await req.json();
    console.log(`Processing QR action: ${action} for QR: ${qrCodeId}, user: ${user.id}`);

    // Handle different actions
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

async function handleScan(supabase: any, qrCodeId: string, userId: string) {
  // 1. Get QR code details
  const { data: qrCode, error: qrError } = await supabase
    .from('loop_qr_codes')
    .select(`
      *,
      business:businesses(id, name, logo_url)
    `)
    .eq('id', qrCodeId)
    .single();

  if (qrError || !qrCode) {
    console.error('QR code not found:', qrError);
    return new Response(JSON.stringify({ error: 'QR code not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  console.log('QR Code found:', qrCode.name, 'Business:', qrCode.business?.name);

  // 2. Validate QR code is active
  if (!qrCode.is_active) {
    return new Response(JSON.stringify({ error: 'This QR code is no longer active' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 3. Check validity dates
  const now = new Date();
  if (qrCode.valid_from && new Date(qrCode.valid_from) > now) {
    return new Response(JSON.stringify({ error: 'This QR code is not yet valid' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  if (qrCode.valid_until && new Date(qrCode.valid_until) < now) {
    return new Response(JSON.stringify({ error: 'This QR code has expired' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 4. Get user's previous scans for this QR
  const { data: previousScans, error: scanHistoryError } = await supabase
    .from('loop_qr_scans')
    .select('id, created_at, status')
    .eq('qr_code_id', qrCodeId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (scanHistoryError) {
    console.error('Error fetching scan history:', scanHistoryError);
  }

  // 5. Check single-use
  if (qrCode.is_single_use && previousScans && previousScans.length > 0) {
    return new Response(JSON.stringify({ error: 'This is a single-use QR code and has already been used' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 6. Check max scans per user
  if (qrCode.max_scans_per_user && previousScans && previousScans.length >= qrCode.max_scans_per_user) {
    return new Response(JSON.stringify({ 
      error: `You've reached the maximum ${qrCode.max_scans_per_user} scans for this QR code` 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 7. Check cooldown period
  if (qrCode.scan_cooldown_hours && previousScans && previousScans.length > 0) {
    const lastScan = new Date(previousScans[0].created_at);
    const cooldownMs = qrCode.scan_cooldown_hours * 60 * 60 * 1000;
    const timeSinceLast = now.getTime() - lastScan.getTime();
    
    if (timeSinceLast < cooldownMs) {
      const hoursRemaining = Math.ceil((cooldownMs - timeSinceLast) / (60 * 60 * 1000));
      return new Response(JSON.stringify({ 
        error: `Please wait ${hoursRemaining} more hour(s) before scanning again` 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // 8. Check business Loop participation status
  const { data: businessSettings } = await supabase
    .from('business_loop_settings')
    .select('*')
    .eq('business_id', qrCode.business_id)
    .single();

  if (!businessSettings || !businessSettings.is_active || businessSettings.loop_tier_id === 'visible_only') {
    return new Response(JSON.stringify({ error: 'This business is not currently participating in Loop' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 9. Check monthly cap
  const { data: tierData } = await supabase
    .from('loop_tiers')
    .select('points_cap_monthly')
    .eq('id', businessSettings.loop_tier_id)
    .single();

  const monthlyRemaining = (tierData?.points_cap_monthly || 0) - (businessSettings.points_issued_this_month || 0);
  if (monthlyRemaining < qrCode.points_value) {
    return new Response(JSON.stringify({ 
      error: 'This business has reached their monthly points limit' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 10. Get or create user wallet
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
      console.error('Error creating wallet:', createError);
      return new Response(JSON.stringify({ error: 'Failed to create wallet' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    wallet = newWallet;
  }

  // 11. Create scan record
  const scanStatus = qrCode.requires_staff_confirm ? 'pending_confirmation' : 'completed';
  
  const { data: scan, error: scanError } = await supabase
    .from('loop_qr_scans')
    .insert({
      qr_code_id: qrCodeId,
      user_id: userId,
      status: scanStatus,
    })
    .select()
    .single();

  if (scanError) {
    console.error('Error creating scan:', scanError);
    return new Response(JSON.stringify({ error: 'Failed to record scan' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 12. If no staff confirmation needed, issue points immediately
  if (!qrCode.requires_staff_confirm) {
    // Create transaction
    const { data: transaction, error: txError } = await supabase
      .from('loop_transactions')
      .insert({
        wallet_id: wallet.id,
        transaction_type: 'earn',
        points: qrCode.points_value,
        business_id: qrCode.business_id,
        qr_code_id: qrCodeId,
        description: `Earned from ${qrCode.name} at ${qrCode.business?.name}`,
      })
      .select()
      .single();

    if (txError) {
      console.error('Error creating transaction:', txError);
    } else {
      // Update wallet balance
      await supabase
        .from('loop_wallets')
        .update({ 
          points_balance: wallet.points_balance + qrCode.points_value,
          lifetime_earned: wallet.lifetime_earned + qrCode.points_value,
        })
        .eq('id', wallet.id);

      // Update business monthly issued
      await supabase
        .from('business_loop_settings')
        .update({ 
          points_issued_this_month: (businessSettings.points_issued_this_month || 0) + qrCode.points_value 
        })
        .eq('id', businessSettings.id);

      // Update QR total scans
      await supabase
        .from('loop_qr_codes')
        .update({ total_scans: (qrCode.total_scans || 0) + 1 })
        .eq('id', qrCodeId);

      // Link transaction to scan
      await supabase
        .from('loop_qr_scans')
        .update({ transaction_id: transaction.id, status: 'completed' })
        .eq('id', scan.id);
    }
  }

  console.log('Scan processed successfully:', scan.id);

  return new Response(JSON.stringify({
    success: true,
    scan: {
      id: scan.id,
      status: scanStatus,
      points: qrCode.points_value,
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
    .select(`
      *,
      qr_code:loop_qr_codes(*, business:businesses(id, name, owner_user_id))
    `)
    .eq('id', scanId)
    .single();

  if (scanError || !scan) {
    console.error('Scan not found:', scanError);
    return new Response(JSON.stringify({ error: 'Scan not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 2. Verify staff is business owner
  if (scan.qr_code?.business?.owner_user_id !== staffUserId) {
    return new Response(JSON.stringify({ error: 'Not authorized to confirm this scan' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 3. Check scan status
  if (scan.status !== 'pending_confirmation') {
    return new Response(JSON.stringify({ error: 'Scan already processed' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 4. Get user wallet
  const { data: wallet } = await supabase
    .from('loop_wallets')
    .select('*')
    .eq('user_id', scan.user_id)
    .eq('city', 'toledo')
    .single();

  if (!wallet) {
    return new Response(JSON.stringify({ error: 'User wallet not found' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 5. Get business settings
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
      points: scan.qr_code.points_value,
      business_id: scan.qr_code.business_id,
      qr_code_id: scan.qr_code.id,
      description: `Earned from ${scan.qr_code.name} at ${scan.qr_code.business?.name}`,
    })
    .select()
    .single();

  if (txError) {
    console.error('Error creating transaction:', txError);
    return new Response(JSON.stringify({ error: 'Failed to issue points' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 7. Update wallet
  await supabase
    .from('loop_wallets')
    .update({ 
      points_balance: wallet.points_balance + scan.qr_code.points_value,
      lifetime_earned: wallet.lifetime_earned + scan.qr_code.points_value,
    })
    .eq('id', wallet.id);

  // 8. Update business monthly cap
  if (businessSettings) {
    await supabase
      .from('business_loop_settings')
      .update({ 
        points_issued_this_month: (businessSettings.points_issued_this_month || 0) + scan.qr_code.points_value 
      })
      .eq('id', businessSettings.id);
  }

  // 9. Update QR stats
  await supabase
    .from('loop_qr_codes')
    .update({ total_scans: (scan.qr_code.total_scans || 0) + 1 })
    .eq('id', scan.qr_code.id);

  // 10. Update scan record
  await supabase
    .from('loop_qr_scans')
    .update({ 
      transaction_id: transaction.id, 
      status: 'completed',
      staff_confirmed_at: new Date().toISOString(),
    })
    .eq('id', scanId);

  console.log('Scan confirmed successfully:', scanId);

  return new Response(JSON.stringify({
    success: true,
    message: `${scan.qr_code.points_value} points issued successfully`,
    points: scan.qr_code.points_value,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
