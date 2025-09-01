const Case = require("../models/Case");
const SuccessHandler = require("../utils/SuccessHandler");
const ErrorHandler = require("../utils/ErrorHandler");
const User = require("../models/User");
const AiAnalysis = require("../models/AiAnalysisi");
const Transaction = require("../models/Transaction");

//get users
const getAllUsers = async (req, res) => {
  // #swagger.tags = ['user']
  try {
      const { page = 1, limit = 10, search = '' } = req.query;
      
      // Build match condition
      let matchCondition = { "role": "user" };
      
      // Add search functionality for email
      if (search && search.trim() !== '') {
        matchCondition.email = { $regex: search.trim(), $options: 'i' };
      }
      
    const users = await User.aggregate([
        {
            $match: matchCondition
        },
         {
        $facet: {
          totalCount: [{ $count: "count" }],
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: (Number(page) - 1) * Number(limit) },
            { $limit: Number(limit) }
          ]
        }
      },
      {
        $unwind: {
          path: "$totalCount",
          preserveNullAndEmptyArrays: true
        }
      }
    ]);
    
    // Handle case where no users found
    const result = users[0] || { totalCount: { count: 0 }, data: [] };
    if (!result.totalCount) {
      result.totalCount = { count: 0 };
    }

    return SuccessHandler(
     result,
      200,
      res
    );
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

// Test database content
const testDbContent = async (req, res) => {
  // #swagger.tags = ['user']
  try {
    const allUsers = await User.find().select('name email role');
    const allCases = await Case.find().select('currentClaim createdAt');
    const allAnalysis = await AiAnalysis.find().select('likes dislikes createdAt');
    
    console.log('Test DB Content:');
    console.log('All Users:', allUsers);
    console.log('All Cases:', allCases);
    console.log('All Analysis:', allAnalysis);
    
    return SuccessHandler({
      users: allUsers,
      cases: allCases,
      analysis: allAnalysis
    }, 200, res);
  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

// Get admin dashboard statistics
const getAdminStats = async (req, res) => {
  // #swagger.tags = ['user']
  try {
    // Get total counts
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalCases = await Case.countDocuments();
    const totalTransactions = await Transaction.countDocuments();
    
    console.log('Database counts - Users:', totalUsers, 'Cases:', totalCases, 'Actual Transactions:', totalTransactions);
    
    // Get total feedbacks (likes + dislikes)
    const feedbackStats = await AiAnalysis.aggregate([
      {
        $project: {
          totalFeedbacks: {
            $add: [
              { $size: { $ifNull: ["$likes", []] } },
              { $size: { $ifNull: ["$dislikes", []] } }
            ]
          },
          likes: { $size: { $ifNull: ["$likes", []] } },
          dislikes: { $size: { $ifNull: ["$dislikes", []] } }
        }
      },
      {
        $group: {
          _id: null,
          totalFeedbacks: { $sum: "$totalFeedbacks" },
          totalLikes: { $sum: "$likes" },
          totalDislikes: { $sum: "$dislikes" }
        }
      }
    ]);

    console.log('Feedback stats from aggregation:', feedbackStats);
    const feedbackData = feedbackStats[0] || { totalFeedbacks: 0, totalLikes: 0, totalDislikes: 0 };
    console.log('Final feedback data:', feedbackData);

    // Get recent users (last 5)
    const recentUsers = await User.find({ role: "user" })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email createdAt planType noOfCasesLeft isFreeTrialUser');

    // Get recent actual transactions (last 5)
    const recentTransactions = await Transaction.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('amountTotal currency paymentStatus type createdAt user stripeSessionId');

    const responseData = {
      stats: {
        totalUsers,
        totalCases,
        totalFeedbacks: feedbackData.totalFeedbacks,
        totalTransactions,
        feedbackBreakdown: {
          likes: feedbackData.totalLikes,
          dislikes: feedbackData.totalDislikes
        }
      },
      recentUsers,
      recentTransactions
    };

    console.log('Admin stats response data:', JSON.stringify(responseData, null, 2));
    
    return SuccessHandler(responseData, 200, res);

  } catch (error) {
    return ErrorHandler(error.message, 500, req, res);
  }
};

module.exports = {
  getAllUsers,
  getAdminStats,
  testDbContent
};