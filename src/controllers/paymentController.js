const SuccessHandler = require("../utils/SuccessHandler");
const ErrorHandler = require("../utils/ErrorHandler");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const createSubscriptionCheckout = async (req, res) => {
  try {
    console.log('Payment request received:', req.body);
    console.log('User:', req.user?.email);
    
    const { productId } = req.body;

    if (!productId) {
      return ErrorHandler("Product ID is required", 400, req, res);
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is not configured');
      return ErrorHandler("Payment system not configured", 500, req, res);
    }

    console.log('Looking for prices for product:', productId);

    // 1. Get the active price(s) for this product
    const prices = await stripe.prices.list({
      product: productId,
      active: true,
      limit: 1,
    });

    console.log('Found prices:', prices.data.length);

    if (!prices.data.length) {
      return ErrorHandler("No active price found for this product", 404, req, res);
    }

    const priceId = prices.data[0].id;
    console.log('Using price ID:', priceId);

    // Determine the correct frontend URL
    const frontendUrl = process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL 
      : 'http://localhost:5173'; // Vite default port

    // 2. Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${frontendUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/cancel`,
      metadata: {
        userId: req.user._id.toString(),
        customNote: "upgrade_to_pro",
      },
    });

    console.log('Stripe session created:', session.id);
    return SuccessHandler({ url: session.url }, 200, res);
  } catch (error) {
    console.error('Payment error:', error);
    return ErrorHandler(error.message, 500, req, res);
  }
};


module.exports = {
  createSubscriptionCheckout
};