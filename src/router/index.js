const router = require("express").Router();
const auth = require("./auth");
const caseRoute = require("./case")
const userRoute = require("./user")

router.use("/auth", auth);
router.use("/user", userRoute);
router.use("/case", caseRoute);

module.exports = router;
