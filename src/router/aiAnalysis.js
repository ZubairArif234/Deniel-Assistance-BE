const express = require("express");
const router = express.Router();
const aiAnalysisController = require("../controllers/aiAnalysisController");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

router
  .route("/getAll")
  .get(isAuthenticated, isAdmin, aiAnalysisController.getAllAnalysis);
// Like an AI analysis
router
  .route("/:analysisId/like")
  .post(isAuthenticated, aiAnalysisController.likeAnalysis);

// Dislike an AI analysis
router
  .route("/:analysisId/dislike")
  .post(isAuthenticated, aiAnalysisController.dislikeAnalysis);

// Get analysis details with like/dislike status
router
  .route("/:analysisId")
  .get(isAuthenticated, aiAnalysisController.getAnalysisDetails);


router.route("/getMine").get(isAuthenticated, aiAnalysisController.getMineAnalysis);

module.exports = router;
