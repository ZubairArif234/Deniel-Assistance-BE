const SuccessHandler = require("../utils/SuccessHandler");
const ErrorHandler = require("../utils/ErrorHandler");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const createPlan = async (req,res) => {
     // #swagger.tags = ['plan']
  try {
    const {
      title,
      description,
      type,
      amount,
      currency,
      duration = "month",
    } = req.body;
    const product = await stripe.products.create({
      name: title,
      description: description,
      metadata: { tier: type }, // optional
    });

    const price = await stripe.prices.create({
      unit_amount: amount * 100 || 1000, // $10.00
      currency: currency,
      recurring: { interval: duration },
      product: product.id, // Link to created product
    });

    return SuccessHandler(
      {
        price,
        product,
      },
      200,
      res
    );
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

const updatePlan = async (req, res) => {
      // #swagger.tags = ['plan']
  try {
    const { id } = req.params; // productId
    const { title, description, active, metadata, amount, currency, duration } = req.body;

    // 1. Update the product fields
    const updatedProduct = await stripe.products.update(id, {
      ...(title && { name: title }),
      ...(description && { description }),
      ...(active !== undefined && { active }),
      ...(metadata && { metadata }),
    });

    let newPrice = null;

    // 2. If user wants to change the price, create a new one
    if (amount || currency || duration) {
      // Get existing prices for the product
      const existingPrices = await stripe.prices.list({ product: id, limit: 1 });

      if (existingPrices.data.length > 0) {
        // Deactivate old price
        await stripe.prices.update(existingPrices.data[0].id, { active: false });
      }

      // Create new price
      newPrice = await stripe.prices.create({
        unit_amount: amount ? amount * 100 : existingPrices.data[0]?.unit_amount,
        currency: currency || existingPrices.data[0]?.currency || "usd",
        recurring: { interval: duration || existingPrices.data[0]?.recurring?.interval || "month" },
        product: id,
      });
    }

    return SuccessHandler(
      { product: updatedProduct, newPrice },
      200,
      res
    );
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

const getSinglePlan = async (req, res) => {
      // #swagger.tags = ['plan']
  try {
    const { id } = req.params; 

    const product = await stripe.products.retrieve(id);
    const prices = await stripe.prices.list({
      product: id,
      limit: 1,
    });

    return SuccessHandler({ product, prices: prices.data }, 200, res);
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

const getAllPlans = async (req, res) => {
      // #swagger.tags = ['plan']
  try {
    
    const products = await stripe.products.list({
      limit: 20,
      active: true,
    });

    const prices = await stripe.prices.list({
      limit: 20,
      expand: ["data.product"], 
    });

    return SuccessHandler({ products, prices }, 200, res);
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};


module.exports = {
  createPlan,
  updatePlan,
  getSinglePlan,
  getAllPlans
};