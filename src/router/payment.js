const express = require("express");
const router = express.Router();
const payment = require("../controllers/paymentController");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

router
  .route("/")
  .post(isAuthenticated, payment.createSubscriptionCheckout);



  
module.exports = router;