import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Product ID to tier mapping (matches SubscriptionContext.tsx)
const PRODUCT_TO_TIER: Record<string, string> = {
  'prod_TpuCGCGKRjz1QR': 'starter',
  'prod_TpuDZjjDGHOFfO': 'pro',
  'prod_TpuDQFgkmlTXAH': 'business',
};

// Tier credits mapping
const TIER_LIMITS: Record<string, { monthlyCredits: number; monthlyEngineering: number }> = {
  'free': { monthlyCredits: 50, monthlyEngineering: 10 },
  'starter': { monthlyCredits: 200, monthlyEngineering: 50 },
  'pro': { monthlyCredits: 1000, monthlyEngineering: 200 },
  'business': { monthlyCredits: 5000, monthlyEngineering: -1 },
};

// Tier display names
const TIER_NAMES: Record<string, string> = {
  'free': 'Free',
  'starter': 'Starter',
  'pro': 'Pro',
  'business': 'Business',
};

// Helper logging function
const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Verify Stripe webhook signature
async function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): Promise<Stripe.Event> {
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });
  
  return await stripe.webhooks.constructEventAsync(body, signature, secret);
}

// Get user by email from Supabase
async function getUserByEmail(supabase: ReturnType<typeof createClient>, email: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, email')
    .eq('email', email)
    .single();
  
  if (error) {
    logStep('User lookup failed', { email, error: error.message });
    return null;
  }
  
  return data;
}

// Update user subscription in database
async function updateUserSubscription(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  tier: string,
  subscriptionData: {
    stripe_subscription_id?: string;
    stripe_customer_id?: string;
    status?: string;
    current_period_end?: string;
  }
) {
  const limits = TIER_LIMITS[tier] || TIER_LIMITS['free'];
  
  // Update user_subscriptions
  const { error: subError } = await supabase
    .from('user_subscriptions')
    .upsert({
      user_id: userId,
      tier,
      stripe_subscription_id: subscriptionData.stripe_subscription_id,
      stripe_customer_id: subscriptionData.stripe_customer_id,
      status: subscriptionData.status,
      current_period_end: subscriptionData.current_period_end,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  
  if (subError) {
    logStep('Failed to update user_subscriptions', { userId, error: subError.message });
  }
  
  // Update user_ai_limits
  const { error: limitsError } = await supabase
    .from('user_ai_limits')
    .upsert({
      user_id: userId,
      monthly_limit: limits.monthlyCredits,
      engineering_limit: limits.monthlyEngineering,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  
  if (limitsError) {
    logStep('Failed to update user_ai_limits', { userId, error: limitsError.message });
  }
  
  return { subError, limitsError };
}

// Send email notification via send-email function
async function sendEmailNotification(
  emailType: string,
  to: string,
  data: Record<string, unknown>,
  userId?: string
) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ to, emailType, data, userId }),
    });
    
    const result = await response.json();
    logStep('Email notification sent', { emailType, to, result });
    return result;
  } catch (error) {
    logStep('Failed to send email', { emailType, to, error: String(error) });
    return null;
  }
}

// Format date for display
function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Format currency amount
function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      logStep("ERROR: STRIPE_WEBHOOK_SECRET not configured");
      return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      logStep("ERROR: No signature header");
      return new Response(JSON.stringify({ error: "No signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = await verifyWebhookSignature(body, signature, webhookSecret);
      logStep("Signature verified", { eventType: event.type, eventId: event.id });
    } catch (err) {
      logStep("ERROR: Signature verification failed", { error: String(err) });
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize Supabase with service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Handle different event types
    switch (event.type) {
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription created", { subscriptionId: subscription.id });

        const customer = await stripe.customers.retrieve(subscription.customer as string);
        if (customer.deleted) break;

        const email = customer.email;
        if (!email) {
          logStep("No customer email found");
          break;
        }

        const user = await getUserByEmail(supabase, email);
        if (!user) {
          logStep("User not found for email", { email });
          break;
        }

        const productId = subscription.items.data[0]?.price?.product as string;
        const tier = PRODUCT_TO_TIER[productId] || 'free';
        const tierName = TIER_NAMES[tier];
        const credits = TIER_LIMITS[tier]?.monthlyCredits || 50;

        await updateUserSubscription(supabase, user.id, tier, {
          stripe_subscription_id: subscription.id,
          stripe_customer_id: customer.id,
          status: subscription.status,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        });

        await sendEmailNotification('subscription_created', email, {
          userName: user.first_name || 'there',
          planName: tierName,
          credits,
          nextBillingDate: formatDate(subscription.current_period_end),
        }, user.id);

        logStep("Subscription created processed", { userId: user.id, tier });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const previousAttributes = event.data.previous_attributes as Partial<Stripe.Subscription>;
        logStep("Subscription updated", { subscriptionId: subscription.id });

        const customer = await stripe.customers.retrieve(subscription.customer as string);
        if (customer.deleted) break;

        const email = customer.email;
        if (!email) break;

        const user = await getUserByEmail(supabase, email);
        if (!user) break;

        const productId = subscription.items.data[0]?.price?.product as string;
        const newTier = PRODUCT_TO_TIER[productId] || 'free';

        await updateUserSubscription(supabase, user.id, newTier, {
          stripe_subscription_id: subscription.id,
          stripe_customer_id: customer.id,
          status: subscription.status,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        });

        // Check if tier changed (plan upgrade/downgrade)
        if (previousAttributes?.items) {
          const previousProductId = previousAttributes.items.data[0]?.price?.product as string;
          const previousTier = PRODUCT_TO_TIER[previousProductId] || 'free';
          
          if (previousTier !== newTier) {
            await sendEmailNotification('subscription_updated', email, {
              userName: user.first_name || 'there',
              oldPlan: TIER_NAMES[previousTier],
              newPlan: TIER_NAMES[newTier],
              effectiveDate: formatDate(Math.floor(Date.now() / 1000)),
            }, user.id);
            
            logStep("Plan change email sent", { from: previousTier, to: newTier });
          }
        }

        logStep("Subscription updated processed", { userId: user.id, tier: newTier });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription deleted", { subscriptionId: subscription.id });

        const customer = await stripe.customers.retrieve(subscription.customer as string);
        if (customer.deleted) break;

        const email = customer.email;
        if (!email) break;

        const user = await getUserByEmail(supabase, email);
        if (!user) break;

        // Get the plan name before downgrading
        const productId = subscription.items.data[0]?.price?.product as string;
        const canceledTier = PRODUCT_TO_TIER[productId] || 'starter';

        // Downgrade to free tier
        await updateUserSubscription(supabase, user.id, 'free', {
          stripe_subscription_id: null,
          stripe_customer_id: customer.id,
          status: 'canceled',
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        });

        await sendEmailNotification('subscription_canceled', email, {
          userName: user.first_name || 'there',
          planName: TIER_NAMES[canceledTier],
          endDate: formatDate(subscription.current_period_end),
        }, user.id);

        logStep("Subscription canceled processed", { userId: user.id });
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Invoice paid", { invoiceId: invoice.id });

        // Skip the first invoice (subscription creation handles that)
        if (invoice.billing_reason === 'subscription_create') {
          logStep("Skipping initial subscription invoice");
          break;
        }

        const customerId = invoice.customer as string;
        const customer = await stripe.customers.retrieve(customerId);
        if (customer.deleted) break;

        const email = customer.email;
        if (!email) break;

        const user = await getUserByEmail(supabase, email);
        if (!user) break;

        // Get subscription details
        const subscriptionId = invoice.subscription as string;
        if (!subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const productId = subscription.items.data[0]?.price?.product as string;
        const tier = PRODUCT_TO_TIER[productId] || 'free';

        // Reset credits on renewal
        const limits = TIER_LIMITS[tier];
        const { error: resetError } = await supabase
          .from('user_ai_limits')
          .update({
            credits_used: 0,
            engineering_used: 0,
            monthly_limit: limits.monthlyCredits,
            engineering_limit: limits.monthlyEngineering,
            last_reset: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (resetError) {
          logStep("Failed to reset credits", { error: resetError.message });
        }

        await sendEmailNotification('subscription_renewed', email, {
          userName: user.first_name || 'there',
          planName: TIER_NAMES[tier],
          amount: formatAmount(invoice.amount_paid, invoice.currency),
          nextBillingDate: formatDate(subscription.current_period_end),
        }, user.id);

        logStep("Invoice paid processed", { userId: user.id, tier });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Invoice payment failed", { invoiceId: invoice.id });

        const customerId = invoice.customer as string;
        const customer = await stripe.customers.retrieve(customerId);
        if (customer.deleted) break;

        const email = customer.email;
        if (!email) break;

        const user = await getUserByEmail(supabase, email);
        if (!user) break;

        // Update subscription status
        const { error } = await supabase
          .from('user_subscriptions')
          .update({
            status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (error) {
          logStep("Failed to update subscription status", { error: error.message });
        }

        // Note: Could send payment_failed email here if template added
        logStep("Payment failed processed", { userId: user.id });
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    // Always return 200 to acknowledge receipt
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    logStep("ERROR: Unhandled exception", { error: String(error) });
    // Still return 200 to prevent Stripe retries on our errors
    return new Response(JSON.stringify({ received: true, error: String(error) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
