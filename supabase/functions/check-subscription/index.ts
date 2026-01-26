import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tier configuration matching frontend
const TIER_LIMITS = {
  free: { monthlyCredits: 5, monthlyEngineering: 10, isDaily: true },
  starter: { monthlyCredits: 500, monthlyEngineering: 50 },
  pro: { monthlyCredits: 1000, monthlyEngineering: 200 },
  business: { monthlyCredits: 3000, monthlyEngineering: 500 },
};

const PRODUCT_TO_TIER: Record<string, keyof typeof TIER_LIMITS> = {
  "prod_TpuCGCGKRjz1QR": "starter",
  "prod_TpuDZjjDGHOFfO": "pro",
  "prod_TpuDQFgkmlTXAH": "business",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found, setting free tier");
      
      // Ensure user has free tier limits
      await supabaseClient
        .from('user_ai_limits')
        .upsert({
          user_id: user.id,
          monthly_messages: TIER_LIMITS.free.monthlyCredits,
          monthly_engineering: TIER_LIMITS.free.monthlyEngineering,
        }, { onConflict: 'user_id' });

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

    // Check for active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let tier: keyof typeof TIER_LIMITS = 'free';
    let productId: string | null = null;
    let subscriptionEnd: string | null = null;
    let subscriptionId: string | null = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionId = subscription.id;
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      productId = subscription.items.data[0].price.product as string;
      
      // Determine tier from product
      tier = PRODUCT_TO_TIER[productId] || 'free';
      logStep("Active subscription found", { subscriptionId, productId, tier, endDate: subscriptionEnd });
    } else {
      logStep("No active subscription found");
    }

    const limits = TIER_LIMITS[tier];

    // Update user_subscriptions table
    await supabaseClient
      .from('user_subscriptions')
      .upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        subscription_tier: tier,
        status: hasActiveSub ? 'active' : 'inactive',
        current_period_end: subscriptionEnd,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    // Update user_ai_limits with new tier limits
    await supabaseClient
      .from('user_ai_limits')
      .upsert({
        user_id: user.id,
        monthly_messages: limits.monthlyCredits,
        monthly_engineering: limits.monthlyEngineering,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    logStep("Database updated", { tier, limits });

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      tier,
      product_id: productId,
      subscription_end: subscriptionEnd,
      limits,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
