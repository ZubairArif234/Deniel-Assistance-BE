const express = require("express");
const router = express.Router();
const caseController = require("../controllers/caseController");
const { isAuthenticated } = require("../middleware/auth");
const uploader = require("../utils/uploader");

router.route("/").post( isAuthenticated,

  uploader.fields([
    { name: "denialScreenShots", maxCount: 5 },
    { name: "encounterScreenShots", maxCount: 5 },
  ]),
  caseController.createCase);

  
module.exports = router;