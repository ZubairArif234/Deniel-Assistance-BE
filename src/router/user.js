const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

router.route("/").get( isAuthenticated,
isAdmin,
  userController.getAllUsers);

  
module.exports = router;