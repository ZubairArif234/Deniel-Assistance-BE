

const SuccessHandler = require("../utils/SuccessHandler");
const ErrorHandler = require("../utils/ErrorHandler");
const AiAnalysis = require("../models/AiAnalysisi");
const { default: mongoose } = require("mongoose");

// get all
const getAllAnalysis = async (req, res) => {
  // #swagger.tags = ['ai']
  try {
    const { page = 1, limit = 10 } = req.query;

    const analysis = await AiAnalysis.aggregate([
       
            {
              $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user"
              }
            },
            { $unwind: "$user" },
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

    const totalCount = analysis[0]?.totalCount?.[0]?.count || 0;
    const data = analysis[0]?.data || [];

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
// get mine
const getMineAnalysis = async (req, res) => {
  // #swagger.tags = ['ai']
  try {
    const {id} = req.user
    const { page = 1, limit = 10 } = req.query;

    const analysis = await AiAnalysis.aggregate([
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
            { $unwind: "$user" },
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

    const totalCount = analysis[0]?.totalCount?.[0]?.count || 0;
    const data = analysis[0]?.data || [];

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

// get single
const getSingleAnalysis = async (req, res) => {
  // #swagger.tags = ['ai']
  try {
    const {id} = req.params
    
    const analysis = await AiAnalysis.findById(id)

    return SuccessHandler(
      analysis,
      200,
      res
    );
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

// like analysis
const likeAnalysis = async (req, res) => {
  // #swagger.tags = ['ai']
  try {
    const {id} = req.params
    const {id: userId}= req.user
    
    const analysis = await AiAnalysis.findById(id)
    if (!analysis) {
      return ErrorHandler("Analysis not found", 404, req, res);
    }

     const alreadyLiked = analysis.likes.includes(userId);
    const alreadyDisliked = analysis.dislikes.includes(userId);

    if (alreadyDisliked) {
      analysis.dislikes.pull(userId);
    }

    if (alreadyLiked) {
      analysis.likes.pull(userId);
    } else {
      analysis.likes.push(userId);
    }

    await analysis.save();

    return SuccessHandler(
      analysis,
      200,
      res
    );
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

// dislike analysis
const dislikeAnalysis = async (req, res) => {
  // #swagger.tags = ['ai']
  try {
    const {id} = req.params
    const {id: userId}= req.user
    
    const analysis = await AiAnalysis.findById(id)
    if (!analysis) {
      return ErrorHandler("Analysis not found", 404, req, res);
    }

  const alreadyDisliked = analysis.dislikes.includes(userId);
    const alreadyLiked = analysis.likes.includes(userId);

    // Remove from likes if present
    if (alreadyLiked) {
      analysis.likes.pull(userId);
    }

    if (alreadyDisliked) {
      // Toggle: remove dislike
      analysis.dislikes.pull(userId);
    } else {
      // Add dislike
      analysis.dislikes.push(userId);
    }

    await analysis.save();

    return SuccessHandler(
      analysis,
      200,
      res
    );
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

module.exports = {
  getAllAnalysis,
  getMineAnalysis,
  getSingleAnalysis,
  likeAnalysis,
  dislikeAnalysis
};