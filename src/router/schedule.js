const express = require("express");
const router = express.Router();
const scheduleController = require("../controllers/scheduleController");
const { isAuthenticated } = require("../middleware/auth");

router.route("/").post( isAuthenticated,
  scheduleController.manageSchedule);
  
module.exports = router;