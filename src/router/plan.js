const express = require("express");
const router = express.Router();
const plan = require("../controllers/planController");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

router
  .route("/")
  .get(isAuthenticated, plan.getAllPlans);
router
  .route("/:id")
  .get(isAuthenticated, plan.getSinglePlan);
router
  .route("/")
  .post(isAuthenticated,isAdmin, plan.createPlan);
router
  .route("/:id")
  .put(isAuthenticated,isAdmin, plan.updatePlan);


  
module.exports = router;