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

    const freeResponse = () =>
      new Response(
        JSON.stringify({
          subscribed: false,
          tier: "free",
          product_id: null,
          subscription_end: null,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );

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
    
    // Handle expired or invalid JWTs gracefully - return free tier instead of error
    let claimsData;
    try {
      const { data, error: claimsError } = await supabaseAuth.auth.getClaims(token);
      if (claimsError || !data?.claims) {
        logStep("Auth invalid, returning free tier", { message: claimsError?.message });
        return freeResponse();
      }
      claimsData = data;
    } catch (authError) {
      // JWT expired or malformed - this is expected, return free tier gracefully
      const errorMsg = authError instanceof Error ? authError.message : String(authError);
      logStep("JWT validation failed (likely expired), returning free tier", { error: errorMsg });
      return freeResponse();
    }

    const userId = claimsData.claims.sub as string;
    const email = claimsData.claims.email as string;
    if (!email) {
      logStep("Email missing from token, returning free tier");
      return freeResponse();
    }

    logStep("User authenticated", { userId, email });

    // Check if user is an early adopter (first 6 businesses get free Anchor Partner)
    const { data: earlyAdopter } = await supabaseAdmin
      .from("early_adopters")
      .select("tier")
      .eq("user_id", userId)
      .single();

    if (earlyAdopter) {
      logStep("User is early adopter", { tier: earlyAdopter.tier });
      return new Response(JSON.stringify({
        subscribed: true,
        tier: earlyAdopter.tier,
        product_id: 'early_adopter',
        subscription_end: null,
        is_early_adopter: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No customer found, returning free tier");
      return new Response(JSON.stringify({ 
        subscribed: false, 
        tier: 'free',
        product_id: null,
        subscription_end: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
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
      
      // Map product IDs to tiers
      const tierMap: Record<string, string> = {
        'prod_TkuOJkqlruAjiG': 'growth',
        'prod_TkuOGiyIs7qK5U': 'pro',
      };
      tier = tierMap[productId] || 'free';
      
      logStep("Active subscription found", { tier, productId, subscriptionEnd });
    } else {
      logStep("No active subscription found");
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      tier,
      product_id: productId,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
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
