const router = require("express").Router();
const auth = require("./auth");
const caseRoute = require("./case")
const userRoute = require("./user")
const aiAnalysisRoute = require("./aiAnalysis")
const aiRoute = require("./ai")

router.use("/auth", auth);
router.use("/user", userRoute);
router.use("/ai-analysis", aiAnalysisRoute);
router.use("/case", caseRoute);
router.use("/ai", aiRoute);

module.exports = router;
