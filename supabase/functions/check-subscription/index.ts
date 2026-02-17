import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const jsonResponse = (body: object, status = 200) =>
      new Response(JSON.stringify(body), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status,
      });

    const freeResponse = () =>
      jsonResponse({
        subscribed: false,
        tier: "free",
        product_id: null,
        subscription_end: null,
      });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      logStep("No auth header, returning free tier");
      return freeResponse();
    }

    const anonKey =
      Deno.env.get("SUPABASE_ANON_KEY") ??
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
      "";

    const supabaseAuth = createClient(Deno.env.get("SUPABASE_URL") ?? "", anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    
    let claimsData;
    try {
      const { data, error: claimsError } = await supabaseAuth.auth.getClaims(token);
      if (claimsError || !data?.claims) {
        logStep("Auth invalid, returning free tier", { message: claimsError?.message });
        return freeResponse();
      }
      claimsData = data;
    } catch (authError) {
      const errorMsg = authError instanceof Error ? authError.message : String(authError);
      logStep("JWT validation failed, returning free tier", { error: errorMsg });
      return freeResponse();
    }

    const userId = claimsData.claims.sub as string;
    const email = claimsData.claims.email as string;
    if (!email) {
      logStep("Email missing from token, returning free tier");
      return freeResponse();
    }

    logStep("User authenticated", { userId, email });

    // 1. Check business tier_status directly (handles founding_5, founding_50, admin-assigned tiers)
    const { data: business } = await supabaseAdmin
      .from("businesses")
      .select("tier_status, tier_badge_visible")
      .eq("owner_user_id", userId)
      .maybeSingle();

    if (business) {
      const dbTier = business.tier_status;
      // Founding tiers and admin-assigned pro/growth are authoritative from the DB
      if (dbTier === 'founding_5' || dbTier === 'founding_50') {
        logStep("Founding tier from DB", { tier: dbTier });
        return jsonResponse({
          subscribed: true,
          tier: dbTier === 'founding_5' ? 'pro' : 'growth', // Map to subscription tier for feature access
          product_id: dbTier,
          subscription_end: null,
          founding_tier: dbTier,
          is_founding: true,
        });
      }
    }

    // 2. Check early adopter table (legacy)
    const { data: earlyAdopter } = await supabaseAdmin
      .from("early_adopters")
      .select("tier")
      .eq("user_id", userId)
      .single();

    if (earlyAdopter) {
      logStep("User is early adopter", { tier: earlyAdopter.tier });
      return jsonResponse({
        subscribed: true,
        tier: earlyAdopter.tier,
        product_id: 'early_adopter',
        subscription_end: null,
        is_early_adopter: true,
      });
    }

    // 3. Check Stripe subscription
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No customer found, returning free tier");
      return freeResponse();
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let productId = null;
    let subscriptionEnd = null;
    let tier = 'free';

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      productId = subscription.items.data[0].price.product as string;
      
      const tierMap: Record<string, string> = {
        'prod_TkuOJkqlruAjiG': 'growth',
        'prod_TkuOGiyIs7qK5U': 'pro',
      };
      tier = tierMap[productId] || 'free';
      
      logStep("Active subscription found", { tier, productId, subscriptionEnd });
    } else {
      logStep("No active subscription found");
    }

    return jsonResponse({
      subscribed: hasActiveSub,
      tier,
      product_id: productId,
      subscription_end: subscriptionEnd,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: "Unable to check subscription status. Please try again." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
