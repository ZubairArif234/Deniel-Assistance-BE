const router = require("express").Router();
const auth = require("./auth");
const caseRoute = require("./case")

router.use("/auth", auth);
router.use("/case", caseRoute);

module.exports = router;
