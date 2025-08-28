const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");
const { isAuthenticated, isAdmin } = require("../middleware/auth");


router.route("/getAll").get( isAuthenticated,isAdmin,
  aiController.getAllAnalysis);
  router.route("/getMine").get( isAuthenticated,
    aiController.getMineAnalysis);
router.route("/:id").get( isAuthenticated,
  aiController.getSingleAnalysis);
router.route("/like/:id").get( isAuthenticated,
  aiController.likeAnalysis);
router.route("/dislike/:id").get( isAuthenticated,
  aiController.dislikeAnalysis);

  
module.exports = router;