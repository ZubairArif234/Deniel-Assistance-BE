const express = require("express");
const router = express.Router();
const caseController = require("../controllers/caseController");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

router.route("/getMine").get( isAuthenticated,
  caseController.getMineCases);
router.route("/getAll").get( isAuthenticated,isAdmin,
  caseController.getAllCases);
router.route("/transactions").get( isAuthenticated,isAdmin,
  caseController.getAllTransactions);
router.route("/").post(isAuthenticated, caseController.createCase);
  
module.exports = router;