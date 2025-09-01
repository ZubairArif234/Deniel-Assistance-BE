const SuccessHandler = require("../utils/SuccessHandler");
const ErrorHandler = require("../utils/ErrorHandler");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const { mongo } = require("mongoose");
const { default: mongoose } = require("mongoose");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log('✅ Webhook signature verified');
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('📨 Received event:', event.type);

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      default:
        console.log(`🤷‍♂️ Unhandled event type: ${event.type}`);
    }

    return SuccessHandler({ received: true }, 200, res);
  } catch (error) {
    console.error('❌ Webhook handler error:', error);
    return ErrorHandler(error.message, 500, req, res);
  }
};

// Handle successful checkout session
const handleCheckoutSessionCompleted = async (session) => {
  console.log('💳 Processing completed checkout session:', session);
  
  try {
    const userId = session.metadata?.userId;
    if (!userId) {
      console.error('❌ No userId in session metadata');
      return;
    }

    // Get the subscription details
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    const product = await stripe.products.retrieve(subscription.items.data[0].price.product);
    
    console.log('📦 Product:', product , subscription);
    console.log('👤 User ID:', userId);

    // Update user in database
    const updateData = {
      isFreeTrialUser: false,
      planType: product.name,
      planId: product.id,
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      noOfCasesLeft: product.metadata.tier === 'basic' ? 10 : 999, // Basic: 10, Pro/Enterprise: unlimited
    };

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
     
    await Transaction.create({
        user: new mongoose.Types.ObjectId(userId),
        stripeSessionId: session.id,
        amountTotal: session.amount_total,
        currency: session.currency,
        paymentStatus: session.payment_status,
        subscriptionId: session.subscription,
        type: "subscription",
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

// Handle subscription created
const handleSubscriptionCreated = async (subscription) => {
  console.log('🔄 Subscription created:', subscription.id);
  // Additional logic if needed
};

// Handle subscription updated
const handleSubscriptionUpdated = async (subscription) => {
  console.log('🔄 Subscription updated:', subscription.id);
  // Handle plan changes, renewals, etc.
};

// Handle subscription deleted/cancelled
const handleSubscriptionDeleted = async (subscription) => {
  console.log('❌ Subscription cancelled:', subscription.id);
  
  try {
    // Find user by planId and downgrade them
    const user = await User.findOne({ planId: subscription.id });
    
    if (user) {
      await User.findByIdAndUpdate(user._id, {
        isFreeTrialUser: true,
        planType: null,
        planId: null,
        noOfCasesLeft: 1, // Reset to free trial
      });
      
      console.log('✅ User downgraded to free trial:', user.email);
    }
  } catch (error) {
    console.error('❌ Error handling subscription deletion:', error);
  }
};

module.exports = {
  handleStripeWebhook
};
