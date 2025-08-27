const Case = require("../models/Case");
const SuccessHandler = require("../utils/SuccessHandler");
const ErrorHandler = require("../utils/ErrorHandler");
const cloud = require("../functions/cloudinary");
const path = require("path");
//create case
const createCase = async (req, res) => {
  // #swagger.tags = ['case']
  try {
    const {denialScreenShots,encounterScreenShots} =  req.files
    const {
      currentClaim,
      prevClaimDOS,
      prevClaimCPT,
      denialText,
      encounterText,
      primaryPayer,
    } = req.body;

let denialScreenShotsUrl = [];
let encounterScreenShotsUrl = [];

if (denialScreenShots?.length > 0) {
  denialScreenShotsUrl = await Promise.all(
    denialScreenShots.map(async (img) => {
      const filePath = `${Date.now()}-${path.parse(img.originalname).name}`;
    const res = await cloud.uploadStreamImage(img.buffer, filePath);
      return res?.secure_url
    })
  );
}

if (encounterScreenShots?.length > 0) {
  encounterScreenShotsUrl = await Promise.all(
    encounterScreenShots.map(async (img) => {
      const filePath = `${Date.now()}-${path.parse(img.originalname).name}`;
       const res = await cloud.uploadStreamImage(img.buffer, filePath);
      return res?.secure_url
    })
  );
}

    const newCase = await Case.create({
      currentClaim,
      prevClaimDOS,
      prevClaimCPT,
      denialScreenShots : denialScreenShotsUrl,
      encounterScreenShots : encounterScreenShotsUrl,
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

    isCaseExist.currentClaim = currentClaim || isCaseExist.currentClaim
    isCaseExist.prevClaimDOS = prevClaimDOS || isCaseExist.prevClaimDOS
    isCaseExist.prevClaimCPT = prevClaimCPT || isCaseExist.prevClaimCPT
    isCaseExist.denialScreenShots = denialScreenShots || isCaseExist.denialScreenShots
    isCaseExist.encounterScreenShots = encounterScreenShots || isCaseExist.encounterScreenShots
    isCaseExist.denialText = denialText || isCaseExist.denialText
    isCaseExist.encounterText = encounterText || isCaseExist.encounterText
    isCaseExist.primaryPayer = primaryPayer || isCaseExist.primaryPayer

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
  updateCase
};
