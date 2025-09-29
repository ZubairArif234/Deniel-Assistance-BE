const SuccessHandler = require("../utils/SuccessHandler");
const ErrorHandler = require("../utils/ErrorHandler");
const User = require("../models/User"); // Assuming this path is correct
const Transaction = require("../models/Transaction"); // Assuming this path is correct
const { default: mongoose } = require("mongoose");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// ======================= HANDLERS =======================

/**
 * Handle successful checkout session after initial purchase.
 * Sets the initial subscription data and base credits.
 */
const handleCheckoutSessionCompleted = async (session) => {
  console.log('💳 Processing completed checkout session:', session);

  try {
    const userId = session.metadata?.userId;
    const productId = session.metadata?.productId;
    if (!userId) {
      console.error('❌ No userId in session metadata for completed session.');
      return;
    }

    // Ensure session was paid successfully
    if (session.payment_status !== 'paid') {
      console.warn(`⚠️ Session not paid for user ${userId}. Status: ${session.payment_status}. Skipping DB update.`);
      return;
    }

    // Retrieve product to determine credit amounts
    const product = await stripe.products.retrieve(productId);
    console.log(product , "product hai ye");
    
    
    const initialBaseCredits = product.name === "Starter"
      ? 30
      : product.name === "Pro"
        ? 80
        : 100

    const subscriptionId = session.subscription;
    const customerId = session.customer; // Use session.customer for Customer ID

    console.log('📦 Product:', product.name);
    console.log('👤 User ID:', userId);
    console.log('⭐ Subscription ID:', subscriptionId);
    
    // Update user in database with initial plan, credits, and Stripe IDs
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          isFreeTrialUser: false,
          planType: product.name,
          planId: product.id,
          subscriptionId: subscriptionId, 
          customerId: customerId,
          baseMonthlyCredits: initialBaseCredits, // Save fixed base amount
          rolloverCasesLeft: 0,                   // Initialize rollover to zero
          subscriptionStatus: 'active',
        },
        $inc: {
          noOfCasesLeft: initialBaseCredits, // Grant initial base credits
        }
      },
      { new: true }
    );

    // Create a transaction record
    await Transaction.create({
      user: new mongoose.Types.ObjectId(userId),
      stripeSessionId: session.id,
      amountTotal: session.amount_total,
      currency: session.currency,
      paymentStatus: session.payment_status,
      subscriptionId: subscriptionId,
      type: "subscription_initial",
    });

    if (updatedUser) {
      console.log('✅ User subscription updated:', updatedUser.email);
    } else {
      console.error('❌ User not found:', userId);
    }
  } catch (error) {
    console.error('❌ Error handling checkout session:', error);
  }
};

/**
 * Handle successful payment for a subscription renewal (the rollover trigger).
 * This implements the 50% rollover of UNUSED BASE credits and expiration of old rollover.
 */
const handleInvoicePaymentSucceeded = async (invoice) => {
  console.log("💰 Invoice payment succeeded:", invoice.id);

  // We only care about successful recurring subscription payments
  if (invoice.billing_reason !== "subscription_cycle") {
    console.log("Invoice is not a subscription renewal cycle. Skipping credit update.");
    return;
  }

  try {
    const subscriptionId = invoice.subscription;
    
    // 1. Find the user based on the subscription ID
    const user = await User.findOne({ subscriptionId: subscriptionId });
    if (!user) {
      console.error("❌ User not found for subscription ID:", subscriptionId);
      return;
    }
    
    // Ensure baseMonthlyCredits is defined (set during checkout.session.completed)
    const currentBaseCredits = user.baseMonthlyCredits || 0;
    
    // The previous rollover amount (which is about to expire)
    const previousRollover = user.rolloverCasesLeft || 0;
    
    // Current total cases left
    const currentTotalCases = user.noOfCasesLeft || 0;

    // --- 2. Calculate Unused Base Credits (The part that rolls over) ---
    
    // Total credits available in the previous cycle: Base + Rollover
    const totalPreviousAllowance = currentBaseCredits + previousRollover;
    
    // Credits used: Total Allowance - Current Remaining
    const totalCreditsUsed = totalPreviousAllowance - currentTotalCases; 

    // We assume rollover is consumed first. So, if usage exceeds rollover, it hits the base.
    const usedFromBase = Math.max(0, totalCreditsUsed - previousRollover);
    const unusedBaseCredits = Math.max(0, currentBaseCredits - usedFromBase);

    // --- 3. Calculate New Rollover (50% of unused base) ---
    const newRolloverAmount = Math.floor(unusedBaseCredits * 0.5);

    // --- 4. Calculate New Total Cases (New Base + New Rollover) ---
    // This logic ensures all previous unused credits (base and old rollover) are expired,
    // leaving only the new base and the calculated 50% rollover.
    const newTotalCases = currentBaseCredits + newRolloverAmount;


    // 5. Update user with new balances
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          noOfCasesLeft: newTotalCases,       // <-- USE $SET to implement full balance reset/expiration
          rolloverCasesLeft: newRolloverAmount, // Save the new rollover value for the *next* cycle's calculation
          subscriptionStatus: 'active', 
        },
      },
      { new: true }
    );

    // 6. Create a transaction record for the renewal
    await Transaction.create({
      user: user._id,
      stripeSessionId: invoice.id, 
      amountTotal: invoice.amount_due,
      currency: invoice.currency,
      paymentStatus: invoice.paid ? "paid" : "unpaid",
      subscriptionId: subscriptionId,
      type: "subscription_renewal",
    });

    console.log(`✅ Renewal for ${updatedUser.email}. Unused Base: ${unusedBaseCredits}, New Rollover: ${newRolloverAmount}. New Total: ${newTotalCases}`);

  } catch (error) {
    console.error("❌ Error handling invoice payment succeeded:", error);
  }
};

// Handle subscription created
const handleSubscriptionCreated = async (subscription) => {
  console.log("🔄 Subscription created:", subscription.id);
  // NOTE: Initial setup is handled by checkout.session.completed, so this can be minimal.
};

// Handle subscription updated (plan upgrades/downgrades)
const handleSubscriptionUpdated = async (subscription) => {
  console.log("🔄 Subscription updated:", subscription.id);
  // You would handle plan changes here (e.g., updating baseMonthlyCredits if needed)
};

// Handle subscription deleted/cancelled
const handleSubscriptionDeleted = async (subscription) => {
  console.log("❌ Subscription cancelled:", subscription.id);

  try {
    const user = await User.findOne({ subscriptionId: subscription.id });

    if (user) {
      // Reset user to free trial status
      await User.findByIdAndUpdate(user._id, {
        // isFreeTrialUser: true,
        planType: null,
        planId: null,
        subscriptionId: null,
        customerId: null,
        baseMonthlyCredits: null,
        // noOfCasesLeft: 1, // reset to trial
        rolloverCasesLeft: 0,
        subscriptionStatus: "Not Subscribed", // e.g., 'canceled'
      });

      console.log("✅ User downgraded to free trial:", user.email);
    }
  } catch (error) {
    console.error("❌ Error handling subscription deletion:", error);
  }
};


// ======================= WEBHOOK ROUTER =======================

const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log("✅ Webhook signature verified");
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log("📨 Received event:", event.type);
  
  try {
    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      case "invoice.payment_succeeded": // <-- Enabled for renewal logic!
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      default:
        console.log(`🤷‍♂️ Unhandled event type: ${event.type}`);
    }

    return SuccessHandler({ received: true }, 200, res);
  } catch (error) {
    console.error("❌ Webhook handler error:", error);
    return ErrorHandler(error.message, 500, req, res);
  }
};

module.exports = {
    handleStripeWebhook,
    // Export handlers for testing if needed
    handleCheckoutSessionCompleted,
    handleInvoicePaymentSucceeded,
};
