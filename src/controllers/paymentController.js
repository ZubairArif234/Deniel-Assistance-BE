const SuccessHandler = require("../utils/SuccessHandler");
const ErrorHandler = require("../utils/ErrorHandler");
const User = require("../models/User");
const dotenv = require("dotenv");
dotenv.config({ path: "./src/config/config.env" });

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const createSubscriptionCheckout = async (req, res) => {
  try {
    const { productId } = req.body; // This is actually the priceId from frontend

    console.log("📦 Received productId (actually priceId):", productId);

    // Validate that it's a price ID format
    if (!productId || !productId.startsWith('price_')) {
      return res.status(400).json({ 
        error: "Invalid price ID format. Expected format: price_xxxxx" 
      });
    }

    // Retrieve and validate the price
    let price;
    try {
      price = await stripe.prices.retrieve(productId, {
        expand: ['product']
      });
      console.log("✅ Price retrieved:", price.id, "Product:", price.product);
    } catch (stripeError) {
      console.error("❌ Stripe price retrieval failed:", stripeError.message);
      return res.status(404).json({ 
        error: `Price not found: ${stripeError.message}` 
      });
    }
    
    if (!price.active) {
      return res.status(400).json({ error: "This price is not active" });
    }

    // Ensure it's a recurring price
    if (!price.recurring) {
      return res.status(400).json({ 
        error: "This is not a subscription price" 
      });
    }

    console.log("💳 Creating checkout session...");
    console.log("💳 Price ",price);

    // Create checkout session using the price ID directly
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: productId, // Use the priceId directly
          quantity: 1,
        },
      ],
      customer_email: req.user.email,
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      metadata: {
        userId: req.user._id.toString(),
        priceId: productId,
        tier:price.name,
        productId: typeof price.product === 'string' ? price.product : price.product.id,
      },
    });

    console.log("✅ Checkout session created:", session.id);
    return SuccessHandler({ url: session.url }, 200, res);
    
  } catch (error) {
    console.error("❌ Stripe Checkout error:", error);
    return ErrorHandler(error.message, 500, req, res);
  }
};



const createBillingPortal = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user?.customerId) {
      return res.status(400).json({ error: "No Stripe customer found for this user" });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.customerId,
      return_url: `${process.env.FRONTEND_URL}/dashboard`, // where user goes back after portal
    });

    return SuccessHandler({ url: portalSession.url }, 200, res);
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};


module.exports = {
  createSubscriptionCheckout,
  createBillingPortal
};