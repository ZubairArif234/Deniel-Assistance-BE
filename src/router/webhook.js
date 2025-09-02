const express = require("express");
const router = express.Router();
const webhook = require("../controllers/webhookController");

// Stripe webhook endpoint (no auth middleware needed)
// Important: This must be raw body, not JSON parsed
router.post("/stripe", express.raw({ type: 'application/json' }), webhook.handleStripeWebhook);

module.exports = router;






