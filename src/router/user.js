const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

router.route("/").get( isAuthenticated,
isAdmin,
  userController.getAllUsers);

router.route("/admin-stats").get( isAuthenticated,
isAdmin,
  userController.getAdminStats);

router.route("/test-db").get( isAuthenticated,
isAdmin,
  userController.testDbContent);

  
module.exports = router;