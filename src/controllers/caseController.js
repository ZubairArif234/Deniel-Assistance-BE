const Case = require("../models/Case");
const User = require("../models/User");
const SuccessHandler = require("../utils/SuccessHandler");
const ErrorHandler = require("../utils/ErrorHandler");
const path = require("path");
const { default: mongoose } = require("mongoose");
const dotenv = require("dotenv");
const AiAnalysis = require("../models/AiAnalysisi");
const geminiService = require("../functions/geminiService");
const { analyzeCaseWithOpenAI } = require("../functions/openaiService");
dotenv.config({ path: "./src/config/config.env" });

//create case
const createCase = async (req, res) => {
  // #swagger.tags = ['case']
  try {
    const {id} = req.user
    const {
      currentClaim,
      previousClaimDOS,
      previousClaimCPT,
      primaryPayer,
      denialText,
      encounterText,
      diagnosisText,
      denialImages = [],
      encounterImages = [],
      diagnosisImages = []
    } = req.body;

    console.log('=== CASE CONTROLLER: PROCESSING BASE64 IMAGES ===');
    console.log('Denial images count:', denialImages.length);
    console.log('Encounter images count:', encounterImages.length);
    console.log('Diagnosis images count:', diagnosisImages.length);

    // Process base64 images for Gemini
    let processedImages = [];
    
    // Process denial images
    denialImages.forEach(img => {
      processedImages.push({
        base64: img.base64,
        mimeType: img.type,
        originalname: img.name,
        type: 'denial'
      });
    });

    // Process encounter images
    encounterImages.forEach(img => {
      processedImages.push({
        base64: img.base64,
        mimeType: img.type,
        originalname: img.name,
        type: 'encounter'
      });
    });

    // Process diagnosis images
    diagnosisImages.forEach(img => {
      processedImages.push({
        base64: img.base64,
        mimeType: img.type,
        originalname: img.name,
        type: 'diagnosis'
      });
    });

    console.log('Total processed images:', processedImages.length);
    console.log('Image details:', processedImages.map(img => `${img.originalname} (${img.type})`));

    const newCase = await Case.create({
      user:id,
      currentClaim,
      previousClaimDOS: previousClaimDOS || null,
      previousClaimCPT: previousClaimCPT || null,
      primaryPayer,
      denialScreenShots: [], // No longer storing URLs, processing directly
      encounterScreenShots: [], // No longer storing URLs, processing directly
      diagnosisScreenShots: [], // No longer storing URLs, processing directly
      denialText: denialText || null,
      encounterText: encounterText || null,
      diagnosisText: diagnosisText || null,
    });

    // Use Gemini for analysis
    console.log('=== CASE CONTROLLER: STARTING GEMINI ANALYSIS ===');
    console.log('Case ID:', newCase._id);
    console.log('User ID:', id);
    
    // Pass the processed images directly to Gemini
    // const geminiResponse = await geminiService.analyzeCaseWithGemini(newCase, processedImages);

    let geminiResponse;
try {
  //  throw new Error("Simulated Gemini failure for testing fallback");
  console.log('=== CASE CONTROLLER: STARTING GEMINI ANALYSIS ===');
  geminiResponse = await geminiService.analyzeCaseWithGemini(newCase, processedImages);
} catch (geminiError) {
  console.error('Gemini failed, falling back to OpenAI...');
  console.error(geminiError.message);

  try {
    geminiResponse = await analyzeCaseWithOpenAI(newCase, processedImages);
  } catch (openAiError) {
    console.error('OpenAI also failed:', openAiError.message);
    throw new Error('Both Gemini and OpenAI failed to process the case');
  }
}
    
    console.log('=== CASE CONTROLLER: GEMINI RESPONSE RECEIVED ===');
    console.log('Raw Gemini response length:', geminiResponse.length);
    
    // Try to parse as JSON, fallback to text if not valid JSON
    let analysis;
    try {
      let jsonString = geminiResponse;
      
      // Check if response is wrapped in markdown code blocks
      const jsonMatch = geminiResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        jsonString = jsonMatch[1];
        console.log('Extracted JSON from markdown code block in controller');
        console.log('Extracted JSON string:', jsonString);
      }
      
      analysis = JSON.parse(jsonString);
      console.log('Successfully parsed Gemini response as JSON');
      console.log('Parsed analysis structure:', Object.keys(analysis));
    } catch (error) {
      console.log('Gemini response is not valid JSON, using fallback format');
      console.log('Parse error:', error.message);
      
      // Try alternative JSON extraction
      try {
        const jsonMatch2 = geminiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch2) {
          const jsonString2 = jsonMatch2[0];
          console.log('Trying alternative JSON extraction in controller:', jsonString2);
          analysis = JSON.parse(jsonString2);
          console.log('Successfully parsed with alternative method in controller');
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (altError) {
        console.log('Alternative JSON extraction also failed in controller:', altError.message);
        // If not valid JSON, wrap in the expected format
        analysis = {
          flows: [geminiResponse],
          improvements: ["Analysis completed using Gemini AI"]
        };
      }
    }
    
    console.log('Final analysis object:', JSON.stringify(analysis, null, 2));
    console.log('=== CASE CONTROLLER: ANALYSIS COMPLETE ===');

    console.log('=== CASE CONTROLLER: CREATING AI ANALYSIS RECORD ===');
    const newAiAnalysis = await AiAnalysis.create({
      case:newCase?._id,
      user:id,
      analysis
    });
    console.log('AI Analysis record created with ID:', newAiAnalysis._id);

    // Decrement user's cases left (important!)
    console.log('=== CASE CONTROLLER: UPDATING USER CASE COUNT ===');
   const updatedUser = await User.findOneAndUpdate(
  { _id: id, noOfCasesLeft: { $gt: 0 } }, // condition
  {
    $inc: { noOfCasesLeft: -1 },
    $set: { isFreeTrialUser: false }
  },
  { new: true }
);

    console.log('User case count updated. Cases left:', updatedUser?.noOfCasesLeft);

    console.log('=== CASE CONTROLLER: SENDING SUCCESS RESPONSE ===');
    console.log('Response data structure:');
    console.log('- Case ID:', newCase._id);
    console.log('- AI Analysis ID:', newAiAnalysis._id);
    console.log('- Analysis keys:', Object.keys(analysis));

    return SuccessHandler(
      {
        user: newCase,
        newAiAnalysis
      },
      200,
      res
    );
  } catch (error) {
    console.error('=== CASE CONTROLLER: ERROR ===');
    console.error('Error in createCase:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Request body keys:', Object.keys(req.body));
    console.error('Request files keys:', Object.keys(req.files || {}));
    console.error('=== END CASE CONTROLLER ERROR ===');
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

    const cases = await AiAnalysis.aggregate([
      {
        $match: { user: new mongoose.Types.ObjectId(id) }

      },
      {
        $lookup: {
          from: "cases",
          localField: "case",
          foreignField: "_id",
          as: "case"
        }
      },
      { $unwind: "$case" },
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

    const cases = await AiAnalysis.aggregate([
      // First, lookup user information
        {
        $lookup: {
          from: "cases",
          localField: "case",
          foreignField: "_id",
          as: "case"
        }
      },
      { $unwind: "$case" },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" }, // Convert user array to object
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
    
    console.log('getAllCases - Total cases found:', totalCount);
    console.log('getAllCases - Sample case with user:', data[0] ? {
      id: data[0]._id,
      user: data[0].user,
      currentClaim: data[0].currentClaim
    } : 'No cases found');

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



// get all transactions (cases with user details for admin)
const getAllTransactions = async (req, res) => {
  // #swagger.tags = ['transaction']
  try {
    const Transaction = require("../models/Transaction");
    const { page = 1, limit = 10, search = '' } = req.query;
    
    // Create aggregation pipeline for actual transactions
    let pipeline = [
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" }
    ];
    
    // Add search functionality for user email if search is provided
    if (search && search.trim() !== '') {
      pipeline.push({
        $match: {
          "user.email": { $regex: search.trim(), $options: 'i' }
        }
      });
    }
    
    // Add facet for pagination
    pipeline.push({
      $facet: {
        totalCount: [{ $count: "count" }],
        data: [
          { $sort: { createdAt: -1 } },
          { $skip: (Number(page) - 1) * Number(limit) },
          { $limit: Number(limit) }
        ]
      }
    });
    
    // Add unwind for totalCount
    pipeline.push({
      $unwind: {
        path: "$totalCount",
        preserveNullAndEmptyArrays: true
      }
    });

    const transactions = await Transaction.aggregate(pipeline);
    
    // Handle case where no transactions found
    const result = transactions[0] || { totalCount: { count: 0 }, data: [] };
    if (!result.totalCount) {
      result.totalCount = { count: 0 };
    }

    return SuccessHandler(
      {
        totalCount: result.totalCount.count,
        data: result.data,
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
  getAllCases,
  getAllTransactions
};
