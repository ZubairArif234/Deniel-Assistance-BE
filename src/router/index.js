const router = require("express").Router();
const auth = require("./auth");
const caseRoute = require("./case")
const userRoute = require("./user")
const aiAnalysisRoute = require("./aiAnalysis")
const aiRoute = require("./ai")
const plan = require("./plan")
const payment = require("./payment")
const webhook = require("./webhook")

router.use("/auth", auth);
router.use("/user", userRoute);
router.use("/ai-analysis", aiAnalysisRoute);
router.use("/case", caseRoute);
router.use("/ai", aiRoute);
router.use("/plan", plan);
router.use("/payment", payment);
router.use("/webhook", webhook);

module.exports = router;
