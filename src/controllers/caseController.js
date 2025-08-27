const Case = require("../models/Case");
const SuccessHandler = require("../utils/SuccessHandler");
const ErrorHandler = require("../utils/ErrorHandler");
const { ideahub_v1beta } = require("googleapis");

//create case
const createCase = async (req, res) => {
  // #swagger.tags = ['case']
  try {
    const {
      currentClaim,
      prevClaimDOS,
      prevClaimCPT,
      denialScreenShots,
      encounterScreenShots,
      denialText,
      encounterText,
      primaryPayer,
    } = req.body;
    const newCase = await Case.create({
      currentClaim,
      prevClaimDOS,
      prevClaimCPT,
      denialScreenShots,
      encounterScreenShots,
      denialText,
      encounterText,
      primaryPayer,
    });

    return SuccessHandler(
      {
        user: newCase,
      },
      200,
      res
    );
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

//create case
const updateCase = async (req, res) => {
  // #swagger.tags = ['case']
  try {
    const { id } = req.params;
    const {
      currentClaim,
      prevClaimDOS,
      prevClaimCPT,
      denialScreenShots,
      encounterScreenShots,
      denialText,
      encounterText,
      primaryPayer,
    } = req.body;
    const isCaseExist = Case.findById(id);

    if (!isCaseExist) {
      return ErrorHandler("Case not found", 404, req, res);
    }

    isCaseExist.currentClaim = currentClaim

    return SuccessHandler(
      {
        user: newCase,
      },
      200,
      res
    );
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

module.exports = {
  createCase,
};
