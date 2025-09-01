const Case = require("../models/Case");
const User = require("../models/User");
const SuccessHandler = require("../utils/SuccessHandler");
const ErrorHandler = require("../utils/ErrorHandler");
const cloud = require("../functions/cloudinary");
const path = require("path");
const OpenAI  = require("openai");
const { default: mongoose } = require("mongoose");
const dotenv = require("dotenv");
const AiAnalysis = require("../models/AiAnalysisi");
dotenv.config({ path: "./src/config/config.env" });

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, 
});

//create case
const createCase = async (req, res) => {
  // #swagger.tags = ['case']
  try {
    const {id} = req.user
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
      user:id,
      currentClaim,
      prevClaimDOS,
      prevClaimCPT,
      denialScreenShots : denialScreenShotsUrl,
      encounterScreenShots : encounterScreenShotsUrl,
      denialText,
      encounterText,
      primaryPayer,
    });

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini", 
      response_format: { type: "json_object" }, 
      messages: [
        {
          role: "system",
          content:
            "You are an assistant that analyzes case entries. Always respond in JSON with 'flows' and 'improvements'.",
        },
        {
          role: "user",
          content: `Here is a case entry: ${JSON.stringify(newCase)}`,
        },
      ],
    });
    
    const analysis = JSON.parse(response.choices[0].message.content);

    const newAiAnalysis = await AiAnalysis.create({
      case:newCase?._id,
      user:id,
      analysis
    })

    // Decrement user's cases left (important!)
   const updatedUser = await User.findOneAndUpdate(
  { _id: id, noOfCasesLeft: { $gt: 0 } }, // condition
  {
    $inc: { noOfCasesLeft: -1 },
    $set: { isFreeTrialUser: false }
  },
  { new: true }
);

    return SuccessHandler(
      {
        user: newCase,
        newAiAnalysis
      },
      200,
      res
    );
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};


// get mine
const getMineCases = async (req, res) => {
  // #swagger.tags = ['case']
  try {
    const { id } = req.user;
    const { page = 1, limit = 10 } = req.query;
console.log(id);

    const cases = await Case.aggregate([
      {
        $match: { user: new mongoose.Types.ObjectId(id) }
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" }, // 👈 makes "user" a single object instead of array
      {
        $facet: {
          totalCount: [{ $count: "count" }],
          data: [
            { $sort: { createdAt: -1 } }, // 👈 latest cases first
            { $skip: (Number(page) - 1) * Number(limit) },
            { $limit: Number(limit) }
          ]
        }
      }
    ]);

    const totalCount = cases[0]?.totalCount?.[0]?.count || 0;
    const data = cases[0]?.data || [];

    return SuccessHandler(
      {
        totalCount,
        data,
        page: Number(page),
        limit: Number(limit)
      },
      200,
      res
    );
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};


// get all
const getAllCases = async (req, res) => {
  // #swagger.tags = ['case']
  try {
    const { page = 1, limit = 10 } = req.query;

    const cases = await Case.aggregate([
      {
        $facet: {
          totalCount: [{ $count: "count" }],
          data: [
            { $sort: { createdAt: -1 } }, // 👈 optional: latest first
            { $skip: (Number(page) - 1) * Number(limit) },
            { $limit: Number(limit) }
          ]
        }
      }
    ]);

    const totalCount = cases[0]?.totalCount?.[0]?.count || 0;
    const data = cases[0]?.data || [];

    return SuccessHandler(
      {
        totalCount,
        data,
        page: Number(page),
        limit: Number(limit),
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
  getMineCases,
  getAllCases
};
