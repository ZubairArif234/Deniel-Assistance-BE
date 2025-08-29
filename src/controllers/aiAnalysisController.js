const AiAnalysis = require("../models/AiAnalysisi");
const SuccessHandler = require("../utils/SuccessHandler");
const ErrorHandler = require("../utils/ErrorHandler");
const { default: mongoose } = require("mongoose");

// Like an AI analysis
const likeAnalysis = async (req, res) => {
  // #swagger.tags = ['ai-analysis']
  try {
    const { analysisId } = req.params;
    const { id: userId } = req.user;

    const analysis = await AiAnalysis.findById(analysisId);
    if (!analysis) {
      return ErrorHandler("AI Analysis not found", 404, req, res);
    }

    // Convert userId to string for comparison
    const userIdStr = userId.toString();
    
    // Check if user already liked
    const hasLiked = analysis.likes.includes(userIdStr);
    
    if (hasLiked) {
      // Remove like
      analysis.likes = analysis.likes.filter(id => id !== userIdStr);
    } else {
      // Add like and remove dislike if exists
      analysis.likes.push(userIdStr);
      analysis.dislikes = analysis.dislikes.filter(id => id !== userIdStr);
    }

    await analysis.save();

    return SuccessHandler(
      {
        analysisId,
        liked: !hasLiked,
        likesCount: analysis.likes.length,
        dislikesCount: analysis.dislikes.length
      },
      200,
      res
    );
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

// Dislike an AI analysis
const dislikeAnalysis = async (req, res) => {
  // #swagger.tags = ['ai-analysis']
  try {
    const { analysisId } = req.params;
    const { id: userId } = req.user;

    const analysis = await AiAnalysis.findById(analysisId);
    if (!analysis) {
      return ErrorHandler("AI Analysis not found", 404, req, res);
    }

    // Convert userId to string for comparison
    const userIdStr = userId.toString();
    
    // Check if user already disliked
    const hasDisliked = analysis.dislikes.includes(userIdStr);
    
    if (hasDisliked) {
      // Remove dislike
      analysis.dislikes = analysis.dislikes.filter(id => id !== userIdStr);
    } else {
      // Add dislike and remove like if exists
      analysis.dislikes.push(userIdStr);
      analysis.likes = analysis.likes.filter(id => id !== userIdStr);
    }

    await analysis.save();

    return SuccessHandler(
      {
        analysisId,
        disliked: !hasDisliked,
        likesCount: analysis.likes.length,
        dislikesCount: analysis.dislikes.length
      },
      200,
      res
    );
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

// Get analysis details with like/dislike status
const getAnalysisDetails = async (req, res) => {
  // #swagger.tags = ['ai-analysis']
  try {
    const { analysisId } = req.params;
    const { id: userId } = req.user;

    const analysis = await AiAnalysis.findById(analysisId)
      .populate('user', 'name email')
      .populate('case');

    if (!analysis) {
      return ErrorHandler("AI Analysis not found", 404, req, res);
    }

    const userIdStr = userId.toString();
    const hasLiked = analysis.likes.includes(userIdStr);
    const hasDisliked = analysis.dislikes.includes(userIdStr);

    return SuccessHandler(
      {
        analysis,
        userInteraction: {
          hasLiked,
          hasDisliked,
          likesCount: analysis.likes.length,
          dislikesCount: analysis.dislikes.length
        }
      },
      200,
      res
    );
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

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



module.exports = {
  likeAnalysis,
  dislikeAnalysis,
  getAnalysisDetails,
  getAllAnalysis,
  getMineAnalysis
};
