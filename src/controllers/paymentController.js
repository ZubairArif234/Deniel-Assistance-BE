const SuccessHandler = require("../utils/SuccessHandler");
const ErrorHandler = require("../utils/ErrorHandler");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const createSubscriptionCheckout = async (req, res) => {
  try {
    const { productId } = req.body; // pass productId instead of priceId

    // 1. Get the active price(s) for this product
    const prices = await stripe.prices.list({
      product: productId,
      active: true,
      limit: 1, // assume only one active price per product
    });

    if (!prices.data.length) {
      return res.status(404).json({ error: "No active price found for this product" });
    }
console.log( "obj",prices)
    const priceId = prices.data[0].id;

    // 2. Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment", // payment (one time payment) , subscription (recursive)
      line_items: [
        {
          // price: prices.data[0]?.unit_amount_decimal,
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: "https://green-appeal-flow-omega.vercel.app/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://green-appeal-flow-omega.vercel.app/cancel",
      metadata: {
    userId: req.user._id.toString(),
    customNote: "upgrade_to_pro",
    productId
  },
    });

     return SuccessHandler({ url: session.url }, 200, res);
  } catch (error) {
     return ErrorHandler(error.message, 500, req, res);
  }
};


module.exports = {
  createSubscriptionCheckout
};