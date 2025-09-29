const express = require("express");
const router = express.Router();
const payment = require("../controllers/paymentController");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

router
  .route("/")
  .post(isAuthenticated, payment.createSubscriptionCheckout);
router
  .route("/manage-subscription")
  .get(isAuthenticated, payment.createBillingPortal);



  
module.exports = router;